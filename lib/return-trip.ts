import { calcDaySummary, formatClock, timeToMinutes } from "@/lib/trip";
import { ItineraryItem, ReturnSettings, Spot } from "@/types";

export const defaultReturnSettings: ReturnSettings = { dinnerTime: "18:30", arrivalStation: "東京駅", rentalReturnMinutes: 30, transferMinutes: 20, delayBufferMinutes: 15 };

const trainMinutes: Record<ReturnSettings["arrivalStation"], number> = { "東京駅": 40, "品川駅": 30, "新宿駅": 65, "渋谷駅": 60 };
export const getTrainEstimate = (station: ReturnSettings["arrivalStation"]) => trainMinutes[station];
export type ReturnCase = { label: "通常" | "混雑" | "混雑悪化"; stationArrival: string; returnComplete: string; trainDeparture: string; tokyoArrival: string; dinnerMargin: number; verdict: string; };

export const returnVerdict = (margin: number) => margin >= 60 ? "余裕あり" : margin >= 30 ? "おおむね問題なし" : margin >= 15 ? "余裕少なめ" : margin >= 0 ? "かなり危険" : "間に合わない可能性";

export const calculateReturnTrip = (day2: ItineraryItem[], spots: Spot[], settings: ReturnSettings = defaultReturnSettings) => {
  const summary = calcDaySummary(day2, spots, "09:00");
  const stationArrival = 9 * 60 + summary.totalMinutes;
  const rawDinner = timeToMinutes(settings.dinnerTime);
  // 深夜帯の夕食指定では、翌日の時刻として扱い、日付またぎでも余裕計算を壊さない。
  const dinner = rawDinner < 6 * 60 ? rawDinner + 1440 : rawDinner;
  const build = (label: ReturnCase["label"], extraDrive: number): ReturnCase => {
    const arrival = stationArrival + extraDrive;
    const completed = arrival + settings.rentalReturnMinutes;
    const departure = completed + settings.transferMinutes;
    const tokyo = departure + getTrainEstimate(settings.arrivalStation) + settings.delayBufferMinutes;
    const margin = dinner - tokyo;
    return { label, stationArrival: formatClock(arrival), returnComplete: formatClock(completed), trainDeparture: formatClock(departure), tokyoArrival: formatClock(tokyo), dinnerMargin: margin, verdict: returnVerdict(margin) };
  };
  const cases = [build("通常", 0), build("混雑", Math.max(12, Math.round(summary.predictedDriveMinutes * .18))), build("混雑悪化", Math.max(28, Math.round(summary.predictedDriveMinutes * .42)))];
  const requiredAfterStation = settings.rentalReturnMinutes + settings.transferMinutes + getTrainEstimate(settings.arrivalStation) + settings.delayBufferMinutes;
  return { cases, recommendedStationArrival: [0, 20, 45].map((extra) => formatClock(dinner - requiredAfterStation - extra)), trainEstimate: `${getTrainEstimate(settings.arrivalStation) - 5}〜${getTrainEstimate(settings.arrivalStation) + 5}分`, summary };
};
