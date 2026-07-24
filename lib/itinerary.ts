import { CustomItemType, CustomLocation, ItineraryItem, ItemType, RentalCarAction, Spot, TransportAction, TransportMode } from "@/types";
import { normalizeCustomLocation } from "@/lib/location";

export type AddPlacement = "end" | "before" | "after" | "time";
export type AddSpotRequest = {
  day: 1 | 2;
  placement: AddPlacement;
  targetId?: string;
  preferredTime?: string;
  /** 同じ施設を別日に明示追加する場合だけ true にする。 */
  allowDuplicate?: boolean;
};

const itemTypes: ItemType[] = ["spot", "meal", "hotel", "break", "rental_car", "transport", "free", "travel_note", "start", "goal"];

export const isTimeValue = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
};

export const normalizeItinerary = (items: ItineraryItem[]) => ([1, 2] as const).flatMap((day) => items
  .filter((item) => item.day === day)
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  .map((item, index) => ({ ...item, order: index + 1 })));

export const addSpotToItinerary = (itinerary: ItineraryItem[], spot: Spot, request: AddSpotRequest, id = `${spot.id}-${request.day}-${Date.now()}`) => {
  if (!request.allowDuplicate && itinerary.some((item) => item.type === "spot" && item.spotId === spot.id)) {
    return { itinerary, added: false, reason: "duplicate" as const };
  }
  const dayItems = itinerary.filter((item) => item.day === request.day).sort((a, b) => a.order - b.order);
  const endingIndex = dayItems.findIndex((item) => item.type === "goal" || (request.day === 1 && item.type === "hotel"));
  const targetIndex = dayItems.findIndex((item) => item.id === request.targetId);
  const fallbackIndex = endingIndex < 0 ? dayItems.length : endingIndex;
  const insertionIndex = request.placement === "before" && targetIndex >= 0
    ? targetIndex
    : request.placement === "after" && targetIndex >= 0
      ? targetIndex + 1
      : fallbackIndex;
  const next: ItineraryItem = {
    id,
    day: request.day,
    type: "spot",
    spotId: spot.id,
    title: spot.name,
    stayMinutes: spot.stayMinutes,
    order: dayItems.length + 1,
    latitude: spot.latitude,
    longitude: spot.longitude,
    startTime: request.placement === "time" && isTimeValue(request.preferredTime) ? request.preferredTime : undefined,
  };
  const reordered = [...dayItems];
  reordered.splice(insertionIndex, 0, next);
  return {
    itinerary: normalizeItinerary([...itinerary.filter((item) => item.day !== request.day), ...reordered]),
    added: true,
    reason: null,
  };
};

export type AddCustomRequest = {
  type: CustomItemType;
  title: string;
  day: 1 | 2;
  stayMinutes: number;
  placement: "start" | "end" | "before" | "after" | "time";
  targetId?: string;
  requestedArrivalTime?: string;
  locationName?: string;
  address?: string;
  note?: string;
  isReserved?: boolean;
  subtype?: RentalCarAction;
  transportMode?: TransportMode;
  transportAction?: TransportAction;
  departureTime?: string;
  arrivalTime?: string;
  destinationName?: string;
  useForReturnTrip?: boolean;
  location?: CustomLocation;
};

export const addCustomItemToItinerary = (itinerary: ItineraryItem[], request: AddCustomRequest, id = `custom-${Date.now()}`) => {
  if (!request.title.trim() || !Number.isFinite(request.stayMinutes) || request.stayMinutes < 0 || request.stayMinutes > 600) return { itinerary, added: false, reason: "invalid" as const };
  if ((request.requestedArrivalTime && !isTimeValue(request.requestedArrivalTime)) || (request.departureTime && !isTimeValue(request.departureTime)) || (request.arrivalTime && !isTimeValue(request.arrivalTime))) return { itinerary, added: false, reason: "invalid" as const };
  const dayItems = itinerary.filter((item) => item.day === request.day).sort((a, b) => a.order - b.order);
  const endingIndex = dayItems.findIndex((item) => item.type === "goal" || (request.day === 1 && item.type === "hotel"));
  const targetIndex = dayItems.findIndex((item) => item.id === request.targetId);
  const end = endingIndex < 0 ? dayItems.length : endingIndex;
  const index = request.placement === "start" ? 0 : request.placement === "before" && targetIndex >= 0 ? targetIndex : request.placement === "after" && targetIndex >= 0 ? targetIndex + 1 : end;
  const now = new Date().toISOString();
  const location = request.location ? normalizeCustomLocation(request.location) : undefined;
  if (request.location && !location) return { itinerary, added: false, reason: "invalid" as const };
  const item: ItineraryItem = { id, day: request.day, type: request.type, title: request.title.trim(), stayMinutes: Math.round(request.stayMinutes), order: dayItems.length + 1, startTime: request.placement === "time" && isTimeValue(request.requestedArrivalTime) ? request.requestedArrivalTime : undefined, locationName: request.locationName?.trim() || location?.name || undefined, address: request.address?.trim() || undefined, note: request.note?.trim() || undefined, isReserved: request.isReserved, subtype: request.subtype, transportMode: request.transportMode, transportAction: request.transportAction, departureTime: request.departureTime, arrivalTime: request.arrivalTime, destinationName: request.destinationName?.trim() || undefined, useForReturnTrip: request.useForReturnTrip, location, latitude: location?.latitude, longitude: location?.longitude, isCustom: true, createdAt: now, updatedAt: now };
  const reordered = [...dayItems]; reordered.splice(index, 0, item);
  return { itinerary: normalizeItinerary([...itinerary.filter((entry) => entry.day !== request.day), ...reordered]), added: true, reason: null };
};

export const moveItineraryItemToDay = (itinerary: ItineraryItem[], id: string, targetDay: 1 | 2) => {
  const item = itinerary.find((entry) => entry.id === id);
  if (!item || item.day === targetDay) return itinerary;
  const sourceItems = itinerary.filter((entry) => entry.day === item.day && entry.id !== id);
  const targetItems = itinerary.filter((entry) => entry.day === targetDay).sort((a, b) => a.order - b.order);
  const endingIndex = targetItems.findIndex((entry) => entry.type === "goal" || (targetDay === 1 && entry.type === "hotel"));
  const nextTarget = [...targetItems];
  nextTarget.splice(endingIndex < 0 ? nextTarget.length : endingIndex, 0, { ...item, day: targetDay });
  return normalizeItinerary([...sourceItems, ...nextTarget]);
};

export const isKnownItemType = (value: unknown): value is ItemType => typeof value === "string" && itemTypes.includes(value as ItemType);
