import { ItineraryItem, Spot } from "@/types";

const R = 6371;
const toRad = (value: number) => (value * Math.PI) / 180;

export const airDistanceKm = (a: { latitude?: number; longitude?: number }, b: { latitude?: number; longitude?: number }) => {
  if (a.latitude === undefined || a.longitude === undefined || b.latitude === undefined || b.longitude === undefined) return 0;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

/** 箱根の山道を意識した、安全側の簡易推計。実ルート取得時も混雑補正に利用する。 */
export const estimateLeg = (a: ItineraryItem, b: ItineraryItem, crowdFactor = 1) => {
  const airKm = airDistanceKm(a, b);
  const distanceKm = airKm * (airKm < 3 ? 1.45 : 1.65);
  const baseMinutes = Math.max(6, Math.round(distanceKm * 2.2 + 4));
  const predictedMinutes = Math.round(baseMinutes * crowdFactor);
  return { distanceKm, baseMinutes, predictedMinutes };
};

export const calcDaySummary = (items: ItineraryItem[], spots: Spot[]) => {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const spotCrowd = (item: ItineraryItem) => spots.find((spot) => spot.id === item.spotId)?.crowdLevel ?? 1;
  const legs = sorted.slice(1).map((item, index) => {
    const previous = sorted[index];
    const factor = 1 + Math.max(0, spotCrowd(item) - 1) * 0.08;
    return estimateLeg(previous, item, factor);
  });
  const distanceKm = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
  const baseDriveMinutes = legs.reduce((sum, leg) => sum + leg.baseMinutes, 0);
  const predictedDriveMinutes = legs.reduce((sum, leg) => sum + leg.predictedMinutes, 0);
  const stayMinutes = sorted.reduce((sum, item) => sum + item.stayMinutes, 0);
  return { legs, distanceKm, baseDriveMinutes, predictedDriveMinutes, stayMinutes, totalMinutes: predictedDriveMinutes + stayMinutes };
};

export const minutesToText = (minutes: number) => `${Math.floor(minutes / 60)}時間${minutes % 60}分`;

export const formatEndTime = (start: string, minutes: number) => {
  const [h, m] = start.split(":").map(Number);
  const date = new Date(2026, 7, 12, h, m + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export type StressResult = { label: "ゆったり" | "標準" | "やや忙しい" | "詰め込みすぎ"; score: number; suggestions: string[] };

export const assessStress = (day1: ItineraryItem[], day2: ItineraryItem[], spots: Spot[]): StressResult => {
  const allDays = [day1, day2].map((day) => calcDaySummary(day, spots));
  const total = allDays.reduce((sum, day) => sum + day.predictedDriveMinutes, 0);
  const day2Spots = day2.filter((item) => item.type === "spot");
  const crowded = day2Spots.filter((item) => (spots.find((spot) => spot.id === item.spotId)?.crowdLevel ?? 1) >= 4);
  const walking = [...day1, ...day2].filter((item) => item.type === "spot").reduce((sum, item) => sum + (spots.find((spot) => spot.id === item.spotId)?.walkingLevel ?? 0), 0);
  const score = Math.round(total / 15 + Math.max(...allDays.map((day) => day.totalMinutes)) / 75 + day2Spots.length * 2 + crowded.length * 3 + walking / 4);
  const suggestions: string[] = [];
  if (day2.some((item) => item.spotId === "owakudani")) suggestions.push("大涌谷を外すと、混雑時の待機と移動を約40分以上減らせる可能性があります。");
  if (day2.some((item) => item.spotId === "pola") && day2.some((item) => item.spotId === "wetland-garden")) suggestions.push("ポーラ美術館と湿生花園は仙石原側でまとめると、山道の往復を抑えられます。");
  if (!day2.some((item) => item.type === "break")) suggestions.push("午後に15〜20分の休憩を一つ入れると、子どもの疲労と運転の集中切れを抑えやすくなります。");
  if (crowded.length > 0) suggestions.push("混雑度が高い地点は9時台に到着するか、当日の公式案内を見て代替候補へ切り替えてください。");
  if (suggestions.length === 0) suggestions.push("現状は仙石原周辺でまとまっています。昼食を11時30分頃にすると混雑を避けやすいです。");
  const label = score <= 26 ? "ゆったり" : score <= 37 ? "標準" : score <= 49 ? "やや忙しい" : "詰め込みすぎ";
  return { label, score, suggestions: suggestions.slice(0, 3) };
};
