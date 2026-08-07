import { describe, expect, it } from "vitest";
import { defaultTravelConditions, normalizeTravelConditions } from "@/lib/conditions";

describe("旅行条件の列車情報", () => {
  it("初日のはこね1号（EXE10）の新宿→小田原を初期値にする", () => {
    expect(defaultTravelConditions).toMatchObject({
      day1StartTime: "09:55",
      outboundTrainService: "はこね1号（EXE10）",
      outboundTrainOrigin: "新宿",
      outboundTrainDestination: "小田原",
      outboundTrainDepartureTime: "08:31",
      outboundTrainMinutes: 84,
    });
  });

  it("旧保存データは列車メタデータを初期値で補完し、利用者の時刻は保持する", () => {
    const normalized = normalizeTravelConditions({
      ...defaultTravelConditions,
      outboundTrainDepartureTime: "07:40",
      outboundTrainMinutes: 90,
      outboundTrainService: undefined,
      outboundTrainOrigin: undefined,
      outboundTrainDestination: undefined,
    });
    expect(normalized).toMatchObject({
      outboundTrainService: "はこね1号（EXE10）",
      outboundTrainOrigin: "新宿",
      outboundTrainDestination: "小田原",
      outboundTrainDepartureTime: "07:40",
      outboundTrainMinutes: 90,
    });
  });

  it("旧版の未変更サンプル条件は、はこね1号の初期条件へ移行する", () => {
    const normalized = normalizeTravelConditions({
      ...defaultTravelConditions,
      day1StartTime: "11:15",
      outboundTrainDepartureTime: "09:50",
      outboundTrainMinutes: 40,
      outboundTrainService: undefined,
      outboundTrainOrigin: undefined,
      outboundTrainDestination: undefined,
    });
    expect(normalized).toMatchObject({
      day1StartTime: "09:55",
      outboundTrainDepartureTime: "08:31",
      outboundTrainMinutes: 84,
    });
  });
});
