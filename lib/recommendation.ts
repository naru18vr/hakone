import { AddSpotRequest, addSpotToItinerary } from "@/lib/itinerary";
import { assessStress, calcDaySummary } from "@/lib/trip";
import { ItineraryItem, Spot } from "@/types";

export type RecommendedPlacement = {
  request: AddSpotRequest;
  afterTitle: string;
  distanceDeltaKm: number;
  driveDeltaMinutes: number;
  endDeltaMinutes: number;
  beforeScore: number;
  afterScore: number;
};

/** 全ての挿入位置を簡易移動時間で比較し、終了地点の直前を含めて最も負担の小さい位置を選ぶ。 */
export const recommendSpotPlacement = (itinerary: ItineraryItem[], spot: Spot, day: 1 | 2, spots: Spot[]): RecommendedPlacement => {
  const dayItems = itinerary.filter((item) => item.day === day).sort((a, b) => a.order - b.order);
  const beforeSummary = calcDaySummary(dayItems, spots, day === 1 ? "11:15" : "09:00");
  const beforeStress = assessStress(itinerary.filter((item) => item.day === 1), itinerary.filter((item) => item.day === 2), spots).score;
  const candidates: AddSpotRequest[] = [
    { day, placement: "end", allowDuplicate: true },
    ...dayItems.map((item) => ({ day, placement: "after" as const, targetId: item.id, allowDuplicate: true })),
  ];
  const evaluated = candidates.map((request) => {
    const next = addSpotToItinerary(itinerary, spot, request, `preview-${spot.id}`);
    const nextDay = next.itinerary.filter((item) => item.day === day);
    const nextSummary = calcDaySummary(nextDay, spots, day === 1 ? "11:15" : "09:00");
    const nextStress = assessStress(next.itinerary.filter((item) => item.day === 1), next.itinerary.filter((item) => item.day === 2), spots).score;
    const afterItem = request.targetId ? dayItems.find((item) => item.id === request.targetId) : dayItems[dayItems.length - 1];
    return {
      request,
      afterTitle: afterItem?.title ?? "この日の開始位置",
      distanceDeltaKm: nextSummary.distanceKm - beforeSummary.distanceKm,
      driveDeltaMinutes: nextSummary.predictedDriveMinutes - beforeSummary.predictedDriveMinutes,
      endDeltaMinutes: nextSummary.totalMinutes - beforeSummary.totalMinutes,
      beforeScore: beforeStress,
      afterScore: nextStress,
    };
  });
  return evaluated.sort((a, b) => a.driveDeltaMinutes - b.driveDeltaMinutes || a.endDeltaMinutes - b.endDeltaMinutes || a.afterScore - b.afterScore)[0];
};
