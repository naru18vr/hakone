import { TravelConditions } from "@/types";

export const defaultTravelConditions: TravelConditions = {
  startDate: "2026-08-12",
  endDate: "2026-08-13",
  day1StartTime: "09:55",
  day2StartTime: "09:00",
  outboundTrainService: "はこね1号（EXE10）",
  outboundTrainOrigin: "新宿",
  outboundTrainDestination: "小田原",
  outboundTrainDepartureTime: "08:31",
  outboundTrainMinutes: 84,
  arrivalPlace: "小田原駅",
  adults: 2,
  juniorHighStudents: 1,
  elementaryStudents: 1,
  transport: "レンタカー",
  planPolicy: "ストレス少なめ",
};

const isTime = (value: unknown): value is string => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 20;
const isTrainMinutes = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 300;

/** 不正な保存値を取り込まず、旧データは初期条件で安全に移行する。 */
export const normalizeTravelConditions = (value: unknown): TravelConditions | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (!isDate(raw.startDate) || !isDate(raw.endDate) || !isTime(raw.day1StartTime) || !isTime(raw.day2StartTime)
    || typeof raw.arrivalPlace !== "string" || !raw.arrivalPlace.trim()
    || !isCount(raw.adults) || !isCount(raw.juniorHighStudents) || !isCount(raw.elementaryStudents)
    || !["レンタカー", "公共交通", "その他"].includes(String(raw.transport))
    || typeof raw.planPolicy !== "string") return undefined;
  const hasTrainMetadata = [raw.outboundTrainService, raw.outboundTrainOrigin, raw.outboundTrainDestination]
    .some((value) => typeof value === "string" && value.trim().length > 0);
  // 旧版の初期サンプルを保存している端末だけは、新しい列車情報へ移行する。
  // 利用者が時刻・所要時間を変更済みの場合は、意図した値を上書きしない。
  const isLegacySample = !hasTrainMetadata
    && raw.day1StartTime === "11:15"
    && raw.outboundTrainDepartureTime === "09:50"
    && raw.outboundTrainMinutes === 40;
  return {
    startDate: raw.startDate,
    endDate: raw.endDate,
    day1StartTime: isLegacySample ? defaultTravelConditions.day1StartTime : raw.day1StartTime,
    day2StartTime: raw.day2StartTime,
    outboundTrainService: typeof raw.outboundTrainService === "string" && raw.outboundTrainService.trim()
      ? raw.outboundTrainService.trim().slice(0, 80)
      : defaultTravelConditions.outboundTrainService,
    outboundTrainOrigin: typeof raw.outboundTrainOrigin === "string" && raw.outboundTrainOrigin.trim()
      ? raw.outboundTrainOrigin.trim().slice(0, 40)
      : defaultTravelConditions.outboundTrainOrigin,
    outboundTrainDestination: typeof raw.outboundTrainDestination === "string" && raw.outboundTrainDestination.trim()
      ? raw.outboundTrainDestination.trim().slice(0, 40)
      : defaultTravelConditions.outboundTrainDestination,
    outboundTrainDepartureTime: isLegacySample
      ? defaultTravelConditions.outboundTrainDepartureTime
      : isTime(raw.outboundTrainDepartureTime) ? raw.outboundTrainDepartureTime : defaultTravelConditions.outboundTrainDepartureTime,
    outboundTrainMinutes: isLegacySample
      ? defaultTravelConditions.outboundTrainMinutes
      : isTrainMinutes(raw.outboundTrainMinutes) ? raw.outboundTrainMinutes : defaultTravelConditions.outboundTrainMinutes,
    arrivalPlace: raw.arrivalPlace.trim(),
    adults: raw.adults,
    juniorHighStudents: raw.juniorHighStudents,
    elementaryStudents: raw.elementaryStudents,
    transport: raw.transport as TravelConditions["transport"],
    planPolicy: raw.planPolicy.trim().slice(0, 80),
  };
};

export const partyLabel = (conditions: TravelConditions) =>
  `大人${conditions.adults}・中学生${conditions.juniorHighStudents}・小学生${conditions.elementaryStudents}`;
