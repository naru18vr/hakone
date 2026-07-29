import { Spot } from "@/types";

const clampCrowd = (value: number): Spot["crowdLevel"] =>
  Math.max(1, Math.min(4, value)) as Spot["crowdLevel"];

/**
 * 旅行日の予測表示用の軽量な補正。
 *
 * 基礎値は施設ごとの一般傾向を維持し、お盆だからという理由だけで
 * 全施設を最高値にしない。昼食時間帯の飲食店、元から混みやすい施設、
 * 雨天時の屋外施設だけを一段階補正する。
 */
export function forecastCrowdLevel(
  spot: Spot,
  visitTime: string,
  weather: "晴れ" | "雨" | "くもり",
): Spot["crowdLevel"] {
  const hour = Number(visitTime.slice(0, 2));
  let adjustment = 0;

  if (spot.crowdLevel >= 3) adjustment += 1;
  if (spot.category === "飲食" && hour >= 11 && hour < 14) adjustment += 1;
  if (weather === "雨" && !spot.rainyDayFriendly) adjustment -= 1;

  return clampCrowd(spot.crowdLevel + adjustment);
}

export function tripAvailabilityLabel(spot: Spot): string {
  if (!spot.tripOpenDays) return "8/12・13は公式確認";
  if (spot.tripOpenDays.length === 0) return "8/12・13 休館予定";
  if (spot.tripOpenDays.length === 2) return "8/12・13 営業予定";
  if (spot.tripOpenDays[0] === 1) return "8/12候補・8/13休業予定";
  return "8/12休業予定・8/13候補";
}

export function isSpotOpenOnDay(spot: Spot, day: 1 | 2): boolean {
  return !spot.tripOpenDays || spot.tripOpenDays.includes(day);
}
