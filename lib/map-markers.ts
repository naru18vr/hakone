import { isValidCoordinates } from "@/lib/location";
import { ItineraryItem } from "@/types";

export type CustomMarkerKind = "meal" | "break" | "hotel" | "rental_car" | "transport" | "free" | "travel_note";
export type MapMarker = {
  item: ItineraryItem;
  day: 1 | 2;
  mapOrder: number;
  isCustom: boolean;
  symbol: string;
  typeLabel: string;
  ariaLabel: string;
};

const markerDetails: Record<CustomMarkerKind, { symbol: string; label: string }> = {
  meal: { symbol: "🍴", label: "食事" },
  break: { symbol: "☕", label: "休憩" },
  hotel: { symbol: "▣", label: "宿泊" },
  rental_car: { symbol: "🚗", label: "レンタカー" },
  transport: { symbol: "🚆", label: "電車・交通" },
  free: { symbol: "★", label: "自由予定" },
  travel_note: { symbol: "✎", label: "移動メモ" },
};

export const isCustomLocatedItem = (item: ItineraryItem) => item.type in markerDetails && isValidCoordinates(item.latitude, item.longitude);

export const buildMapMarkers = (itinerary: ItineraryItem[], routeDay: 1 | 2 | "all"): MapMarker[] => ([1, 2] as const).flatMap((day) => {
  if (routeDay !== "all" && routeDay !== day) return [];
  return itinerary.filter((item) => item.day === day && isValidCoordinates(item.latitude, item.longitude)).sort((a, b) => a.order - b.order).map((item, index) => {
    const custom = isCustomLocatedItem(item);
    const details = custom ? markerDetails[item.type as CustomMarkerKind] : { symbol: item.type === "start" ? "出" : item.type === "goal" ? "着" : "観", label: item.type === "spot" ? "観光地" : item.type === "start" ? "出発地点" : "終了地点" };
    return { item, day, mapOrder: index + 1, isCustom: custom, symbol: details.symbol, typeLabel: details.label, ariaLabel: `${day}日目・地図${index + 1}番・${details.label}予定「${item.title}」` };
  });
});
