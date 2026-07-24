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
  const distanceKm = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
  const baseDriveMinutes = legs.reduce((sum, leg) => sum + leg.baseMinutes, 0);
  const predictedDriveMinutes = legs.reduce((sum, leg) => sum + leg.predictedMinutes, 0);
  const stayMinutes = sorted.reduce((sum, item) => sum + item.stayMinutes, 0);
  return { legs, distanceKm, baseDriveMinutes, predictedDriveMinutes, stayMinutes, waitMinutes: schedule.waitMinutes, totalMinutes: predictedDriveMinutes + stayMinutes + schedule.waitMinutes };
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
};

export const getStressLabel = (score: number): StressResult["label"] => {
  if (score <= 20) return "かなりゆったり";
  if (score <= 40) return "ゆったり";
  if (score <= 60) return "標準";
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

export const assessStress = (day1: ItineraryItem[], day2: ItineraryItem[], spots: Spot[]): StressResult => {
  const allDays = [calcDaySummary(day1, spots, "11:15"), calcDaySummary(day2, spots, "09:00")];
  const totalDrive = allDays.reduce((sum, day) => sum + day.predictedDriveMinutes, 0);
  const spotItems = [...day1, ...day2].filter((item) => item.type === "spot");
  const crowded = spotItems.filter((item) => (spots.find((spot) => spot.id === item.spotId)?.crowdLevel ?? 1) >= 4);
  const parkingRisk = spotItems.filter((item) => {
    const spot = spots.find((candidate) => candidate.id === item.spotId);
    return (spot?.crowdLevel ?? 1) >= 3 && (spot?.parkingSpaces?.includes("少") || spot?.parkingSpaces?.includes("台"));
  });
  const walking = spotItems.reduce((sum, item) => sum + (spots.find((spot) => spot.id === item.spotId)?.walkingLevel ?? 0), 0);
  const busiestDay = Math.max(...allDays.map((day) => day.totalMinutes));
  const hasBreak = [day1, day2].some((day) => day.some((item) => item.type === "break"));
  const day2ReturnMinutes = allDays[1].totalMinutes;

  const breakdown: StressBreakdown[] = [
    { label: "移動負荷", score: Math.min(22, Math.round(totalDrive / 8)), max: 22, note: `混雑考慮の運転 ${minutesToText(totalDrive)}` },
    { label: "道路混雑リスク", score: Math.min(15, crowded.length * 4 + spotItems.filter((item) => (spots.find((spot) => spot.id === item.spotId)?.crowdLevel ?? 1) === 3).length * 2), max: 15, note: `混雑が高い候補 ${crowded.length}件` },
    { label: "駐車場待ちリスク", score: Math.min(10, parkingRisk.length * 3), max: 10, note: `混雑しやすい駐車場 ${parkingRisk.length}件` },
    { label: "徒歩負荷", score: Math.min(10, Math.round(walking / 2)), max: 10, note: `歩く量の合計 ${walking} / 5段階` },
    { label: "予定の詰まり", score: Math.min(15, Math.max(0, Math.round((busiestDay - 220) / 20)) + Math.max(0, spotItems.length - 4) * 2), max: 15, note: `最も長い日 ${minutesToText(busiestDay)}` },
    { label: "休憩不足", score: hasBreak ? 1 : 8, max: 8, note: hasBreak ? "休憩を予定済み" : "独立した休憩が未設定" },
    { label: "子どもの疲れ", score: Math.min(8, Math.round(walking / 5) + crowded.length * 2), max: 8, note: "歩く量と混雑を加味" },
    { label: "帰京時刻への余裕", score: Math.min(12, Math.max(0, Math.round((day2ReturnMinutes - 300) / 18))), max: 12, note: `2日目の行程 ${minutesToText(day2ReturnMinutes)}` },
  ];
  const score = Math.min(100, breakdown.reduce((sum, item) => sum + item.score, 0));
  const suggestions: string[] = [];
  if (day2.some((item) => item.spotId === "owakudani")) suggestions.push("大涌谷を外すと、混雑時の待機と移動を約40分以上減らせる可能性があります。");
  if (day2.some((item) => item.spotId === "pola") && day2.some((item) => item.spotId === "wetland-garden")) suggestions.push("ポーラ美術館と湿生花園は仙石原側でまとめると、山道の往復を抑えられます。");
  if (!day2.some((item) => item.type === "break")) suggestions.push("午後に15〜20分の休憩を一つ入れると、子どもの疲労と運転の集中切れを抑えやすくなります。");
  if (crowded.length > 0) suggestions.push("混雑度が高い地点は9時台に到着するか、当日の公式案内を見て代替候補へ切り替えてください。");
  const label = getStressLabel(score);
  if (score >= 81) suggestions.unshift("負荷スコアが81点以上です。行き先を一つ以上減らすか、2日目の滞在時間を短くしてください。");
  else if (score >= 61) suggestions.unshift("負荷スコアが61点以上です。混雑しやすい場所を朝に回すか、午後の訪問先を一つ減らすと安心です。");
  else if (suggestions.length === 0) suggestions.push("現状は仙石原周辺でまとまっています。昼食を11時30分頃にすると混雑を避けやすいです。");
  return { label, score, breakdown, suggestions: suggestions.slice(0, 3) };
};
