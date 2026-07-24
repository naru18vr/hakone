import { CustomLocation, LocationSource, Spot } from "@/types";

const sources: LocationSource[] = ["map", "spot", "odawara", "hotel", "selected", "manual"];

export const isValidLatitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
export const isValidLongitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
export const isValidCoordinates = (latitude: unknown, longitude: unknown) => isValidLatitude(latitude) && isValidLongitude(longitude);
export const roundCoordinate = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
export const isLocationSource = (value: unknown): value is LocationSource => typeof value === "string" && sources.includes(value as LocationSource);

export const locationFromSpot = (spot: Pick<Spot, "id" | "name" | "latitude" | "longitude">, source: Extract<LocationSource, "spot" | "odawara" | "selected"> = "spot"): CustomLocation => ({
  name: spot.name,
  latitude: roundCoordinate(spot.latitude),
  longitude: roundCoordinate(spot.longitude),
  source,
  spotId: spot.id,
});

export const normalizeCustomLocation = (value: unknown): CustomLocation | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const latitude = candidate.latitude;
  const longitude = candidate.longitude;
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude) || !isLocationSource(candidate.source)) return undefined;
  return {
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : undefined,
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    source: candidate.source,
    spotId: typeof candidate.spotId === "string" ? candidate.spotId : undefined,
  };
};

export const isOutsideHakoneArea = (location: Pick<CustomLocation, "latitude" | "longitude">) => location.latitude < 35.1 || location.latitude > 35.4 || location.longitude < 138.85 || location.longitude > 139.2;
