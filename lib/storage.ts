import { isKnownItemType, isTimeValue, normalizeItinerary } from "@/lib/itinerary";
import { ItineraryItem, SavedTripState, Spot, TripState } from "@/types";

export type RestoreResult =
  | { status: "missing" }
  | { status: "restored"; saved: SavedTripState }
  | { status: "invalid" | "unsupported"; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isDateString = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const isDay = (value: unknown): value is 1 | 2 => value === 1 || value === 2;
const isRouteDay = (value: unknown): value is 1 | 2 | "all" => isDay(value) || value === "all";

function restoreItem(value: unknown, spotIds: Set<string>): ItineraryItem | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isDay(value.day) || !isKnownItemType(value.type) || typeof value.title !== "string") return null;
  if (typeof value.stayMinutes !== "number" || !Number.isFinite(value.stayMinutes) || value.stayMinutes < 0) return null;
  if (typeof value.order !== "number" || !Number.isFinite(value.order) || value.order < 1) return null;
  if (value.type === "spot" && (typeof value.spotId !== "string" || !spotIds.has(value.spotId))) return null;
  if (value.startTime !== undefined && !isTimeValue(value.startTime)) return null;
  if (value.latitude !== undefined && (typeof value.latitude !== "number" || !Number.isFinite(value.latitude))) return null;
  if (value.longitude !== undefined && (typeof value.longitude !== "number" || !Number.isFinite(value.longitude))) return null;
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
    latitude: typeof value.latitude === "number" ? value.latitude : undefined,
    longitude: typeof value.longitude === "number" ? value.longitude : undefined,
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
  const itinerary = data.itinerary.map((item) => restoreItem(item, spotIds));
  if (itinerary.some((item) => !item)) return { status: "invalid", message: "存在しない観光地または不正な旅程が含まれています。" };
  const ids = itinerary.map((item) => item!.id);
  if (new Set(ids).size !== ids.length) return { status: "invalid", message: "旅程の識別子が重複しています。" };
  const activeFilters = data.activeFilters.filter((filter): filter is string => typeof filter === "string" && allowedFilters.includes(filter));
  const selectedSpotId = typeof data.selectedSpotId === "string" && spotIds.has(data.selectedSpotId) ? data.selectedSpotId : undefined;
  return {
    status: "restored",
    saved: {
      version: 1,
      savedAt: parsed.savedAt,
      data: {
        itinerary: normalizeItinerary(itinerary as ItineraryItem[]),
        hotelName: data.hotelName.trim(),
        selectedSpotId,
        activeDay: data.activeDay,
        routeDay: data.routeDay,
        activeFilters,
        crowdMode: data.crowdMode,
        visitTime: data.visitTime,
        weather: data.weather,
      },
    },
  };
}
