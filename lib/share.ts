import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { normalizeItinerary } from "@/lib/itinerary";
import { isValidCoordinates, normalizeCustomLocation } from "@/lib/location";
import { ItineraryItem, SharedTripPayload, Spot, TripState } from "@/types";

const SHARE_VERSION = 1;
export const SHARE_QUERY_KEY = "plan";

const sanitizeItem = (item: ItineraryItem, includeNotes: boolean): ItineraryItem => ({
  id: item.id,
  day: item.day,
  type: item.type,
  spotId: item.spotId,
  title: item.title,
  startTime: item.startTime,
  endTime: item.endTime,
  stayMinutes: item.stayMinutes,
  order: item.order,
  latitude: item.latitude,
  longitude: item.longitude,
  locationName: item.locationName,
  address: item.address,
  isReserved: item.isReserved,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  isCustom: item.isCustom,
  subtype: item.subtype,
  transportMode: item.transportMode,
  transportAction: item.transportAction,
  departureTime: item.departureTime,
  arrivalTime: item.arrivalTime,
  destinationName: item.destinationName,
  useForReturnTrip: item.useForReturnTrip,
  location: item.location,
  ...(includeNotes && item.note ? { note: item.note } : {}),
});

export const createSharedPayload = (state: TripState, includeNotes = false): SharedTripPayload => ({
  version: SHARE_VERSION,
  createdAt: new Date().toISOString(),
  trip: {
    itinerary: state.itinerary.map((item) => sanitizeItem(item, includeNotes)),
    hotelName: state.hotelName,
    activeFilters: state.activeFilters,
    crowdMode: state.crowdMode,
    visitTime: state.visitTime,
    weather: state.weather,
    returnSettings: state.returnSettings,
    travelDates: "2026-08-12/2026-08-13",
    party: "大人2・中学生1・小学生1",
  },
});

export const encodeSharedPayload = (payload: SharedTripPayload) => compressToEncodedURIComponent(JSON.stringify(payload));

export const createShareUrl = (origin: string, basePath: string, state: TripState, includeNotes = false) => {
  const url = new URL(basePath || "/", origin);
  url.searchParams.set(SHARE_QUERY_KEY, encodeSharedPayload(createSharedPayload(state, includeNotes)));
  return url.toString();
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isDay = (value: unknown): value is 1 | 2 => value === 1 || value === 2;
const isTime = (value: unknown): value is string => typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
const restoreItem = (value: unknown, spotIds: Set<string>): ItineraryItem | null => {
  if (!isRecord(value) || typeof value.id !== "string" || !isDay(value.day) || typeof value.type !== "string" || typeof value.title !== "string" || typeof value.stayMinutes !== "number" || typeof value.order !== "number") return null;
  if (value.type === "spot" && (typeof value.spotId !== "string" || !spotIds.has(value.spotId))) return null;
  if (value.startTime !== undefined && !isTime(value.startTime)) return null;
  if ((value.latitude !== undefined || value.longitude !== undefined) && !isValidCoordinates(value.latitude, value.longitude)) return null;
  const location = value.location === undefined ? undefined : normalizeCustomLocation(value.location);
  if (value.location !== undefined && !location) return null;
  return { id: value.id, day: value.day, type: value.type as ItineraryItem["type"], spotId: typeof value.spotId === "string" ? value.spotId : undefined, title: value.title, stayMinutes: value.stayMinutes, order: value.order, startTime: typeof value.startTime === "string" ? value.startTime : undefined, endTime: typeof value.endTime === "string" ? value.endTime : undefined, latitude: location?.latitude ?? (typeof value.latitude === "number" ? value.latitude : undefined), longitude: location?.longitude ?? (typeof value.longitude === "number" ? value.longitude : undefined), locationName: typeof value.locationName === "string" ? value.locationName : location?.name, address: typeof value.address === "string" ? value.address : undefined, isReserved: typeof value.isReserved === "boolean" ? value.isReserved : undefined, createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined, updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined, note: typeof value.note === "string" ? value.note : undefined, isCustom: typeof value.isCustom === "boolean" ? value.isCustom : undefined, subtype: typeof value.subtype === "string" ? value.subtype as ItineraryItem["subtype"] : undefined, transportMode: typeof value.transportMode === "string" ? value.transportMode as ItineraryItem["transportMode"] : undefined, transportAction: typeof value.transportAction === "string" ? value.transportAction as ItineraryItem["transportAction"] : undefined, departureTime: isTime(value.departureTime) ? value.departureTime : undefined, arrivalTime: isTime(value.arrivalTime) ? value.arrivalTime : undefined, destinationName: typeof value.destinationName === "string" ? value.destinationName : undefined, useForReturnTrip: typeof value.useForReturnTrip === "boolean" ? value.useForReturnTrip : undefined, location };
};

export type SharedDecodeResult = { ok: true; payload: SharedTripPayload; state: Pick<TripState, "itinerary" | "hotelName" | "activeFilters" | "crowdMode" | "visitTime" | "weather" | "returnSettings"> } | { ok: false; message: string };

export const decodeSharedPayload = (encoded: string | null, spots: Spot[]): SharedDecodeResult => {
  if (!encoded) return { ok: false, message: "共有データが見つかりません。" };
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return { ok: false, message: "共有URLが途中で切れているか、読み取れません。" };
    const value: unknown = JSON.parse(json);
    if (!isRecord(value) || value.version !== SHARE_VERSION || !isRecord(value.trip)) return { ok: false, message: "この共有URLの形式には対応していません。" };
    const trip = value.trip;
    if (!Array.isArray(trip.itinerary) || typeof trip.hotelName !== "string" || !Array.isArray(trip.activeFilters) || (trip.crowdMode !== "forecast" && trip.crowdMode !== "general") || !isTime(trip.visitTime) || !["晴れ", "雨", "くもり"].includes(String(trip.weather))) return { ok: false, message: "共有旅程の必須項目が不足しています。" };
    const items = trip.itinerary.map((item) => restoreItem(item, new Set(spots.map((spot) => spot.id))));
    if (items.some((item) => !item)) return { ok: false, message: "存在しない観光地または不正な予定が含まれています。" };
    const itinerary = normalizeItinerary(items as ItineraryItem[]);
    const state = { itinerary, hotelName: trip.hotelName, activeFilters: trip.activeFilters.filter((item): item is string => typeof item === "string"), crowdMode: trip.crowdMode as TripState["crowdMode"], visitTime: trip.visitTime, weather: trip.weather as TripState["weather"], returnSettings: isRecord(trip.returnSettings) ? trip.returnSettings as TripState["returnSettings"] : undefined };
    return { ok: true, payload: value as SharedTripPayload, state };
  } catch {
    return { ok: false, message: "共有旅程を読み込めませんでした。URLが破損している可能性があります。" };
  }
};

export const shareUrlLengthLevel = (length: number) => length >= 5000 ? "warning" : length >= 2000 ? "long" : "normal";
