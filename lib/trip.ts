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

export const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatClock = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};

export const buildDaySchedule = (items: ItineraryItem[], spots: Spot[], startTime = "09:00") => {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const spotCrowd = (item: ItineraryItem) => spots.find((spot) => spot.id === item.spotId)?.crowdLevel ?? 1;
  const legs = sorted.slice(1).map((item, index) => {
    const previous = sorted[index];
    if (previous.latitude === undefined || previous.longitude === undefined || item.latitude === undefined || item.longitude === undefined) return undefined;
    const factor = 1 + Math.max(0, spotCrowd(item) - 1) * 0.08;
    return estimateLeg(previous, item, factor);
  });
  const startMinutes = timeToMinutes(startTime);
  let cursor = startMinutes;
  const entries = sorted.map((item, index) => {
    const leg = index > 0 ? legs[index - 1] : undefined;
    const naturalArrival = cursor + (leg?.predictedMinutes ?? 0);
    const requestedArrival = item.startTime ? timeToMinutes(item.startTime) : naturalArrival;
    const arrivalMinutes = Math.max(naturalArrival, requestedArrival);
    const waitMinutes = Math.max(0, arrivalMinutes - naturalArrival);
    cursor = arrivalMinutes + item.stayMinutes;
    return { item, leg, arrivalMinutes, arrivalOffset: arrivalMinutes - startMinutes, waitMinutes };
  });
  return { sorted, legs, entries, waitMinutes: entries.reduce((sum, entry) => sum + entry.waitMinutes, 0), endMinutes: cursor };
};

export const calcDaySummary = (items: ItineraryItem[], spots: Spot[], startTime = "09:00") => {
  const schedule = buildDaySchedule(items, spots, startTime);
  const { sorted, legs } = schedule;
  const knownLegs = legs.filter((leg): leg is NonNullable<typeof leg> => Boolean(leg));
  const distanceKm = knownLegs.reduce((sum, leg) => sum + leg.distanceKm, 0);
  const baseDriveMinutes = knownLegs.reduce((sum, leg) => sum + leg.baseMinutes, 0);
  const predictedDriveMinutes = knownLegs.reduce((sum, leg) => sum + leg.predictedMinutes, 0);
  const stayMinutes = sorted.reduce((sum, item) => sum + item.stayMinutes, 0);
  return { legs, distanceKm, baseDriveMinutes, predictedDriveMinutes, stayMinutes, waitMinutes: schedule.waitMinutes, endMinutes: schedule.endMinutes, totalMinutes: predictedDriveMinutes + stayMinutes + schedule.waitMinutes };
};

export const calcTripSummary = (day1: ItineraryItem[], day2: ItineraryItem[], spots: Spot[]) => {
  const firstDay = calcDaySummary(day1, spots, "11:15");
  const secondDay = calcDaySummary(day2, spots, "09:00");
  return {
    day1: firstDay,
    day2: secondDay,
    distanceKm: firstDay.distanceKm + secondDay.distanceKm,
    baseDriveMinutes: firstDay.baseDriveMinutes + secondDay.baseDriveMinutes,
    predictedDriveMinutes: firstDay.predictedDriveMinutes + secondDay.predictedDriveMinutes,
    stayMinutes: firstDay.stayMinutes + secondDay.stayMinutes,
    waitMinutes: firstDay.waitMinutes + secondDay.waitMinutes,
    totalMinutes: firstDay.totalMinutes + secondDay.totalMinutes,
  };
};

export const minutesToText = (minutes: number) => `${Math.floor(minutes / 60)}時間${minutes % 60}分`;

export const formatEndTime = (start: string, minutes: number) => {
  return formatClock(timeToMinutes(start) + minutes);
};

export type StressBreakdown = {
  label: string;
  score: number;
  max: number;
  note: string;
};

export type StressResult = {
  label: "かなりゆったり" | "ゆったり" | "標準" | "やや忙しい" | "詰め込みすぎ";
  score: number;
  breakdown: StressBreakdown[];
  suggestions: string[];
  days: Record<1 | 2, Omit<StressResult, "days">>;
};

export const getStressLabel = (score: number): StressResult["label"] => {
  if (score <= 25) return "かなりゆったり";
  if (score <= 45) return "ゆったり";
  if (score <= 65) return "標準";
  if (score <= 80) return "やや忙しい";
  return "詰め込みすぎ";
};

export const getStressDescription = (label: StressResult["label"]) => ({
  "かなりゆったり": "時間の余白が大きく、急な混雑や休憩にも対応しやすい計画です。",
  "ゆったり": "移動と滞在のバランスがよく、家族旅行として余裕のある計画です。",
  "標準": "通常は無理なく回れますが、混雑時は休憩や訪問順の調整がおすすめです。",
  "やや忙しい": "移動・混雑・歩く量のいずれかが大きめです。優先度の低い場所を一つ減らすと安心です。",
  "詰め込みすぎ": "予定の密度が高く、混雑時に帰着時刻が大きくずれるおそれがあります。訪問先の削減をおすすめします。",
})[label];

const dayStress = (items: ItineraryItem[], spots: Spot[], day: 1 | 2): Omit<StressResult, "days"> => {
  const summary = calcDaySummary(items, spots, day === 1 ? "11:15" : "09:00");
  const spotItems = items.filter((item) => item.type === "spot");
  const spotData = spotItems.map((item) => spots.find((spot) => spot.id === item.spotId)).filter((spot): spot is Spot => Boolean(spot));
  const highCrowd = spotData.filter((spot) => spot.crowdLevel >= 4).length;
  const mediumCrowd = spotData.filter((spot) => spot.crowdLevel === 3).length;
  const parkingRisk = spotData.filter((spot) => spot.crowdLevel >= 3 && spot.parkingAvailable).length;
  const walking = spotData.reduce((sum, spot) => sum + spot.walkingLevel, 0);
  const explicitBreak = items.some((item) => item.type === "break");
  const mealMinutes = items.filter((item) => item.type === "meal").reduce((sum, item) => sum + item.stayMinutes, 0);
  const hotelEarly = day === 1 && items.some((item) => item.type === "hotel") && summary.endMinutes <= 16 * 60;
  const restCredit = explicitBreak ? 1 : mealMinutes >= 60 ? .7 : mealMinutes >= 30 ? .4 : hotelEarly ? .5 : 0;
  const hasReturnGoal = items.some((item) => item.type === "goal" || item.spotId === "odawara-station");
  const repeatedStops = new Set(spotItems.map((item) => item.spotId)).size < spotItems.length;
  const returnRisk = day === 2
    ? Math.min(10, Math.max(0, Math.round((summary.totalMinutes - 330) / 24)) + (hasReturnGoal ? 0 : 3))
    : 0;
  const breakdown: StressBreakdown[] = [
    { label: "運転時間", score: Math.min(15, Math.round(summary.predictedDriveMinutes / 15)), max: 15, note: `混雑考慮の運転 ${minutesToText(summary.predictedDriveMinutes)}` },
    { label: "道路混雑", score: Math.min(15, highCrowd * 4 + mediumCrowd * 2), max: 15, note: `高 ${highCrowd}件・やや高 ${mediumCrowd}件` },
    { label: "駐車場待ち", score: Math.min(10, parkingRisk * 2), max: 10, note: `混雑予測の駐車場 ${parkingRisk}件` },
    { label: "観光地数", score: Math.min(10, Math.max(0, spotItems.length - 2) * 3), max: 10, note: `観光地 ${spotItems.length}件` },
    { label: "徒歩量", score: Math.min(10, Math.round(walking / 3)), max: 10, note: `歩く量の合計 ${walking} / 5段階` },
    { label: "休憩不足", score: Math.round((summary.totalMinutes > 360 ? 7 : summary.totalMinutes > 270 ? 4 : 1) * (1 - restCredit)), max: 10, note: explicitBreak ? "明示的な休憩を予定済み" : mealMinutes >= 60 ? "60分以上の食事を70%の休憩として評価" : mealMinutes >= 30 ? "食事を40%の休憩として評価" : hotelEarly ? "早めの宿到着を一部休憩として評価" : "独立した休憩が未設定" },
    { label: "子どもの疲れ", score: Math.min(10, Math.round(walking / 4) + highCrowd * 2 + (summary.totalMinutes > 390 ? 2 : 0)), max: 10, note: "歩く量・混雑・行程時間を加味" },
    { label: "営業時間の余裕", score: Math.min(5, summary.endMinutes > 16 * 60 ? 4 : summary.endMinutes > 15 * 60 ? 2 : 0), max: 5, note: `終了予定 ${formatClock(summary.endMinutes)}` },
    { label: "帰京時刻の余裕", score: returnRisk, max: 10, note: day === 2 ? `2日目の行程 ${minutesToText(summary.totalMinutes)}` : "宿泊で翌日にリセット" },
    { label: "同じ道の往復", score: repeatedStops ? 5 : 0, max: 5, note: repeatedStops ? "同じ観光地を複数回通過" : "同じ地点の往復は未検出" },
  ];
  const score = Math.min(100, breakdown.reduce((sum, item) => sum + item.score, 0));
  const label = getStressLabel(score);
  const suggestions: string[] = [];
  if (restCredit < .7 && score > 35) suggestions.push("15〜20分の休憩を一つ入れると、運転と子どもの疲れを抑えやすくなります。");
  if (highCrowd > 0) suggestions.push("混雑が高い地点は朝に回すか、当日の公式案内を見て代替候補へ切り替えてください。");
  if (returnRisk >= 5) suggestions.push("2日目は小田原へ戻る時刻を早めると、東京での夕食に余裕を作れます。");
  return { label, score, breakdown, suggestions: suggestions.slice(0, 3) };
};

/** 日ごとのピークを重視し、宿泊によるリセット分を差し引いた比較用スコア。 */
export const assessStress = (day1: ItineraryItem[], day2: ItineraryItem[], spots: Spot[]): StressResult => {
  const first = dayStress(day1, spots, 1);
  const second = dayStress(day2, spots, 2);
  const peak = Math.max(first.score, second.score);
  const lower = Math.min(first.score, second.score);
  const score = Math.min(100, Math.round(peak * 0.72 + lower * 0.18 + (first.score >= 55 && second.score >= 55 ? 5 : 0)));
  const label = getStressLabel(score);
  const suggestions = [...second.suggestions, ...first.suggestions];
  if (day2.some((item) => item.spotId === "owakudani")) suggestions.unshift("大涌谷を外すと、混雑時の待機と移動を約40分以上減らせる可能性があります。");
  if (score >= 66) suggestions.unshift("負荷がやや高めです。優先度の低い場所を一つ減らすか、混雑しやすい場所を朝に回すと安心です。");
  if (suggestions.length === 0) suggestions.push("現状は移動と滞在のバランスが取れています。昼食を早めにするとさらに余裕ができます。");
  return { label, score, breakdown: [...first.breakdown, ...second.breakdown], suggestions: [...new Set(suggestions)].slice(0, 3), days: { 1: first, 2: second } };
};
