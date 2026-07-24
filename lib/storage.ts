import { isKnownItemType, isTimeValue, normalizeItinerary } from "@/lib/itinerary";
import { isValidCoordinates, normalizeCustomLocation } from "@/lib/location";
import { ItineraryItem, RentalCarAction, ReturnSettings, SavedTripState, Spot, TransportAction, TransportMode, TripState } from "@/types";

export type RestoreResult =
  | { status: "missing" }
  | { status: "restored"; saved: SavedTripState }
  | { status: "invalid" | "unsupported"; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isDateString = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const isDay = (value: unknown): value is 1 | 2 => value === 1 || value === 2;
const isRouteDay = (value: unknown): value is 1 | 2 | "all" => isDay(value) || value === "all";
const isReturnSettings = (value: unknown): value is ReturnSettings => isRecord(value) && isTimeValue(value.dinnerTime) && ["東京駅", "品川駅", "新宿駅", "渋谷駅"].includes(String(value.arrivalStation)) && ["rentalReturnMinutes", "transferMinutes", "delayBufferMinutes"].every((key) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0);
const rentalActions: RentalCarAction[] = ["pickup", "return", "procedure", "refuel", "other"];
const transportModes: TransportMode[] = ["train", "bus", "walk", "taxi", "other"];
const transportActions: TransportAction[] = ["board", "exit", "transfer", "move"];

function restoreItem(value: unknown, spotIds: Set<string>): ItineraryItem | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isDay(value.day) || !isKnownItemType(value.type) || typeof value.title !== "string") return null;
  if (typeof value.stayMinutes !== "number" || !Number.isFinite(value.stayMinutes) || value.stayMinutes < 0) return null;
  if (value.stayMinutes > 600 && value.type !== "hotel") return null;
  if (typeof value.order !== "number" || !Number.isFinite(value.order) || value.order < 1) return null;
  if (value.type === "spot" && (typeof value.spotId !== "string" || !spotIds.has(value.spotId))) return null;
  if (value.startTime !== undefined && !isTimeValue(value.startTime)) return null;
  if ((value.latitude !== undefined || value.longitude !== undefined) && !isValidCoordinates(value.latitude, value.longitude)) return null;
  const location = value.location === undefined ? undefined : normalizeCustomLocation(value.location);
  if (value.location !== undefined && !location) return null;
  return {
    id: value.id,
    day: value.day,
    type: value.type,
    spotId: typeof value.spotId === "string" ? value.spotId : undefined,
    title: value.title,
    startTime: typeof value.startTime === "string" ? value.startTime : undefined,
    endTime: typeof value.endTime === "string" && isTimeValue(value.endTime) ? value.endTime : undefined,
    stayMinutes: value.stayMinutes,
    order: value.order,
    latitude: location?.latitude ?? (typeof value.latitude === "number" ? value.latitude : undefined),
    longitude: location?.longitude ?? (typeof value.longitude === "number" ? value.longitude : undefined),
    note: typeof value.note === "string" ? value.note : undefined,
    locationName: typeof value.locationName === "string" ? value.locationName : undefined,
    address: typeof value.address === "string" ? value.address : undefined,
    isReserved: typeof value.isReserved === "boolean" ? value.isReserved : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    isCustom: typeof value.isCustom === "boolean" ? value.isCustom : undefined,
    subtype: rentalActions.includes(value.subtype as RentalCarAction) ? value.subtype as RentalCarAction : undefined,
    transportMode: transportModes.includes(value.transportMode as TransportMode) ? value.transportMode as TransportMode : undefined,
    transportAction: transportActions.includes(value.transportAction as TransportAction) ? value.transportAction as TransportAction : undefined,
    departureTime: isTimeValue(value.departureTime) ? value.departureTime : undefined,
    arrivalTime: isTimeValue(value.arrivalTime) ? value.arrivalTime : undefined,
    destinationName: typeof value.destinationName === "string" ? value.destinationName : undefined,
    useForReturnTrip: typeof value.useForReturnTrip === "boolean" ? value.useForReturnTrip : undefined,
    location,
  };
}

export function serializeTripState(data: TripState): SavedTripState {
  return { version: 1, savedAt: new Date().toISOString(), data };
}

export function restoreTripState(raw: string | null, spots: Spot[], allowedFilters: readonly string[]): RestoreResult {
  if (!raw) return { status: "missing" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "invalid", message: "保存データを読み取れませんでした。" };
  }
  if (!isRecord(parsed) || typeof parsed.version !== "number") return { status: "invalid", message: "保存データの形式が不完全です。" };
  if (parsed.version !== 1) return { status: "unsupported", message: "この保存データのバージョンには対応していません。" };
  if (!isDateString(parsed.savedAt) || !isRecord(parsed.data)) return { status: "invalid", message: "保存日時または旅程データが不正です。" };

  const data = parsed.data;
  const spotIds = new Set(spots.map((spot) => spot.id));
  if (!Array.isArray(data.itinerary) || typeof data.hotelName !== "string" || !data.hotelName.trim() || !isDay(data.activeDay) || !isRouteDay(data.routeDay) || !Array.isArray(data.activeFilters) || (data.crowdMode !== "forecast" && data.crowdMode !== "general") || !isTimeValue(data.visitTime) || (data.weather !== "晴れ" && data.weather !== "雨" && data.weather !== "くもり")) {
    return { status: "invalid", message: "保存データの必須項目が不足しています。" };
  }
  const restoredItems = data.itinerary.map((item) => restoreItem(item, spotIds));
  const customTypes = ["meal", "break", "hotel", "rental_car", "transport", "free", "travel_note"];
  // 旧保存データは従来どおり復元し、不正なカスタム予定だけは除外して全体を壊さない。
  for (let index = 0; index < restoredItems.length; index += 1) {
    if (restoredItems[index]) continue;
    const raw = data.itinerary[index];
    if (!isRecord(raw) || !customTypes.includes(String(raw.type))) return { status: "invalid", message: "存在しない観光地または不正な旅程が含まれています。" };
  }
  const validItems = restoredItems.filter((item): item is ItineraryItem => Boolean(item));
  if (validItems.length === 0 && data.itinerary.length > 0) return { status: "invalid", message: "存在しない観光地または不正な旅程が含まれています。" };
  const ids = validItems.map((item) => item.id);
  const deduped = validItems.filter((item, index) => ids.indexOf(item.id) === index);
  const activeFilters = data.activeFilters.filter((filter): filter is string => typeof filter === "string" && allowedFilters.includes(filter));
  const selectedSpotId = typeof data.selectedSpotId === "string" && spotIds.has(data.selectedSpotId) ? data.selectedSpotId : undefined;
  return {
    status: "restored",
    saved: {
      version: 1,
      savedAt: parsed.savedAt,
      data: {
        itinerary: normalizeItinerary(deduped),
        hotelName: data.hotelName.trim(),
        selectedSpotId,
        activeDay: data.activeDay,
        routeDay: data.routeDay,
        activeFilters,
        crowdMode: data.crowdMode,
        visitTime: data.visitTime,
        weather: data.weather,
        returnSettings: isReturnSettings(data.returnSettings) ? data.returnSettings : undefined,
      },
    },
  };
}
