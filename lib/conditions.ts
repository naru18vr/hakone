import { TravelConditions } from "@/types";

export const defaultTravelConditions: TravelConditions = {
  startDate: "2026-08-12",
  endDate: "2026-08-13",
  day1StartTime: "11:15",
  day2StartTime: "09:00",
  outboundTrainDepartureTime: "09:50",
  outboundTrainMinutes: 40,
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
  return {
    startDate: raw.startDate,
    endDate: raw.endDate,
    day1StartTime: raw.day1StartTime,
    day2StartTime: raw.day2StartTime,
    outboundTrainDepartureTime: isTime(raw.outboundTrainDepartureTime) ? raw.outboundTrainDepartureTime : defaultTravelConditions.outboundTrainDepartureTime,
    outboundTrainMinutes: isTrainMinutes(raw.outboundTrainMinutes) ? raw.outboundTrainMinutes : defaultTravelConditions.outboundTrainMinutes,
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
