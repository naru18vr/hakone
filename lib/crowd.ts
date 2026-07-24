import { CrowdInfo, Spot } from "@/types";

export const crowdText = (level: number) => ["", "低", "やや低", "中", "高", "非常に高い"][Math.max(1, Math.min(5, level))];

export const crowdDetails = (spot: Spot): { facility: CrowdInfo; parking: CrowdInfo; road: CrowdInfo; hourly: CrowdInfo[] } => {
  const base = Math.min(5, spot.crowdLevel + 1) as CrowdInfo["level"];
  const source: CrowdInfo["source"] = spot.crowdSource === "realtime" ? "realtime" : spot.crowdSource === "manual" ? "manual" : "forecast";
  const common = { source, confidence: "medium" as const, updatedAt: spot.crowdUpdatedAt, reasons: ["お盆期間", spot.crowdHint, "時間帯別の一般的な傾向"] };
  const facility: CrowdInfo = { ...common, level: base };
  const parking: CrowdInfo = { ...common, level: Math.min(5, base + (spot.parkingAvailable ? 0 : -1)) as CrowdInfo["level"], reasons: [...common.reasons, "駐車場規模を加味"] };
  const road: CrowdInfo = { ...common, level: Math.min(5, base + (["大涌谷", "元箱根", "箱根神社"].includes(spot.name) ? 1 : 0)) as CrowdInfo["level"], reasons: [...common.reasons, "周辺道路の混みやすさを加味"] };
  const hourly = Array.from({ length: 9 }, (_, index) => {
    const hour = index + 9;
    const boost = hour >= 11 && hour <= 13 ? 1 : hour >= 15 ? -1 : 0;
    return { ...facility, level: Math.max(1, Math.min(5, facility.level + boost)) as CrowdInfo["level"] };
  });
  return { facility, parking, road, hourly };
};
