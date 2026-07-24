import { describe, expect, it } from "vitest";
import { initialPlan } from "@/data/plans";
import { spots } from "@/data/spots";
import { addSpotToItinerary, moveItineraryItemToDay } from "@/lib/itinerary";
import { createRouteCache, getRoutePresentation, routeModeForElapsed } from "@/lib/routing";
import { recommendSpotPlacement } from "@/lib/recommendation";
import { calculateReturnTrip, defaultReturnSettings, returnVerdict } from "@/lib/return-trip";
import { crowdDetails } from "@/lib/crowd";
import { createShareUrl, createSharedPayload, decodeSharedPayload, shareUrlLengthLevel } from "@/lib/share";
import { restoreTripState, serializeTripState } from "@/lib/storage";
import { assessStress, calcDaySummary, calcTripSummary, estimateLeg, getStressLabel } from "@/lib/trip";
import { ItineraryItem, TripState } from "@/types";

const clonePlan = () => initialPlan.itinerary.map((item) => ({ ...item }));
const byId = (id: string) => {
  const spot = spots.find((item) => item.id === id);
  if (!spot) throw new Error(`spot not found: ${id}`);
  return spot;
};
const defaultState = (): TripState => ({
  itinerary: clonePlan(),
  hotelName: "テスト宿",
  selectedSpotId: "glass-forest",
  activeDay: 1,
  routeDay: "all",
  activeFilters: ["自然"],
  crowdMode: "forecast",
  visitTime: "11:30",
  weather: "晴れ",
});

describe("旅程の計算と編集", () => {
  it("順番を変えると到着時刻と移動集計を再計算する", () => {
    const day = clonePlan().filter((item) => item.day === 2);
    const reordered = [...day].reverse().map((item, index) => ({ ...item, order: index + 1 }));
    const before = calcDaySummary(day, spots, "09:00");
    const after = calcDaySummary(reordered, spots, "09:00");
    expect(before.legs).toHaveLength(after.legs.length);
    expect(before.totalMinutes).not.toBe(after.totalMinutes);
  });

  it("日付移動後に日ごとの集計と順番を正規化する", () => {
    const original = clonePlan();
    const source = original.find((item) => item.type === "spot" && item.day === 1);
    if (!source) throw new Error("test source missing");
    const moved = moveItineraryItemToDay(original, source.id, 2);
    expect(moved.find((item) => item.id === source.id)?.day).toBe(2);
    expect(moved.filter((item) => item.day === 2).map((item) => item.order)).toEqual(moved.filter((item) => item.day === 2).map((_, index) => index + 1));
  });

  it("混雑考慮時間は通常時間以上になる", () => {
    const [from, to] = clonePlan().filter((item) => item.latitude !== undefined).slice(0, 2);
    const leg = estimateLeg(from, to, 1.24);
    expect(leg.predictedMinutes).toBeGreaterThanOrEqual(leg.baseMinutes);
  });

  it("同じ観光地は重複追加しない", () => {
    const existing = clonePlan();
    const result = addSpotToItinerary(existing, byId("glass-forest"), { day: 2, placement: "end" }, "duplicate-test");
    expect(result.added).toBe(false);
    expect(result.reason).toBe("duplicate");
    expect(result.itinerary).toEqual(existing);
  });

  it("明示した場合だけ既存観光地を別日に追加できる", () => {
    const result = addSpotToItinerary(clonePlan(), byId("glass-forest"), { day: 2, placement: "end", allowDuplicate: true }, "explicit-duplicate");
    expect(result.added).toBe(true);
    expect(result.itinerary.filter((item) => item.spotId === "glass-forest")).toHaveLength(2);
  });

  it("おすすめ追加位置は増加時間と負荷の情報を返す", () => {
    const result = recommendSpotPlacement(clonePlan(), byId("wetland-garden"), 1, spots);
    expect(result.request.day).toBe(1);
    expect(result.driveDeltaMinutes).toBeGreaterThanOrEqual(0);
    expect(result.afterScore).toBeGreaterThanOrEqual(0);
  });
});

describe("負荷スコア", () => {
  it.each([
    [0, "かなりゆったり"], [25, "かなりゆったり"], [26, "ゆったり"], [45, "ゆったり"], [46, "標準"], [65, "標準"], [66, "やや忙しい"], [80, "やや忙しい"], [81, "詰め込みすぎ"], [100, "詰め込みすぎ"],
  ] as const)("%i点は%s", (score, label) => expect(getStressLabel(score)).toBe(label));

  it("算出したスコアと表示ラベルは同じ区分を使う", () => {
    const day1 = clonePlan().filter((item) => item.day === 1);
    const day2 = clonePlan().filter((item) => item.day === 2);
    const result = assessStress(day1, day2, spots);
    expect(result.label).toBe(getStressLabel(result.score));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.days[1].label).toBe(getStressLabel(result.days[1].score));
    expect(result.days[2].label).toBe(getStressLabel(result.days[2].score));
  });
});

describe("保存データ", () => {
  it("バージョン付きデータを復元し、並び順を正規化する", () => {
    const state = defaultState();
    state.itinerary = state.itinerary.map((item, index) => ({ ...item, order: 99 - index }));
    const restored = restoreTripState(JSON.stringify(serializeTripState(state)), spots, ["自然"]);
    expect(restored.status).toBe("restored");
    if (restored.status !== "restored") return;
    expect(restored.saved.version).toBe(1);
    expect(restored.saved.data.itinerary.filter((item) => item.day === 1)[0].order).toBe(1);
  });

  it("壊れたJSONと存在しない観光地IDは初期化対象として扱う", () => {
    expect(restoreTripState("{broken", spots, []).status).toBe("invalid");
    const state = defaultState();
    state.itinerary = [{ ...state.itinerary[0], type: "spot", spotId: "missing-spot" } as ItineraryItem];
    expect(restoreTripState(JSON.stringify(serializeTripState(state)), spots, []).status).toBe("invalid");
  });
});

describe("経路の表示と全体集計", () => {
  it("道路経路の失敗時は簡易推計と明示する", () => {
    expect(getRoutePresentation("fallback")).toMatchObject({ status: "estimate", label: "簡易推計" });
  });

  it("2秒を超える経路計算状態は待機中であることを明示する", () => {
    expect(getRoutePresentation("slow")).toMatchObject({ status: "recalculating", label: "計算に時間がかかっています" });
  });

  it("経路取得は2秒で待機案内、8秒で簡易推計へ移る", () => {
    expect(routeModeForElapsed(1999)).toBe("loading");
    expect(routeModeForElapsed(2000)).toBe("slow");
    expect(routeModeForElapsed(7999)).toBe("slow");
    expect(routeModeForElapsed(8000)).toBe("fallback");
  });

  it("同じ順序の道路経路はセッションキャッシュから再利用する", () => {
    const cache = createRouteCache();
    const items = clonePlan().filter((item) => item.day === 1);
    const route = { geometry: [[35.1, 139.1] as [number, number]], source: "routing" as const };
    cache.set(items, route);
    expect(cache.get(items)).toEqual(route);
    expect(cache.size()).toBe(1);
  });

  it("1日目・2日目・全体の合計が一致する", () => {
    const itinerary = clonePlan();
    const summary = calcTripSummary(itinerary.filter((item) => item.day === 1), itinerary.filter((item) => item.day === 2), spots);
    expect(summary.distanceKm).toBeCloseTo(summary.day1.distanceKm + summary.day2.distanceKm);
    expect(summary.predictedDriveMinutes).toBe(summary.day1.predictedDriveMinutes + summary.day2.predictedDriveMinutes);
    expect(summary.stayMinutes).toBe(summary.day1.stayMinutes + summary.day2.stayMinutes);
  });
});

describe("帰京と混雑の比較情報", () => {
  it("東京夕食への通常・混雑・悪化ケースを時刻順に算出する", () => {
    const result = calculateReturnTrip(clonePlan().filter((item) => item.day === 2), spots, defaultReturnSettings);
    expect(result.cases).toHaveLength(3);
    expect(result.cases[0].dinnerMargin).toBeGreaterThan(result.cases[1].dinnerMargin);
    expect(result.cases[1].dinnerMargin).toBeGreaterThan(result.cases[2].dinnerMargin);
  });

  it("夕食余裕の判定区分を返す", () => {
    expect(returnVerdict(60)).toBe("余裕あり");
    expect(returnVerdict(59)).toBe("おおむね問題なし");
    expect(returnVerdict(30)).toBe("おおむね問題なし");
    expect(returnVerdict(29)).toBe("余裕少なめ");
    expect(returnVerdict(15)).toBe("余裕少なめ");
    expect(returnVerdict(14)).toBe("かなり危険");
    expect(returnVerdict(0)).toBe("かなり危険");
    expect(returnVerdict(-1)).toBe("間に合わない可能性");
  });

  it("深夜の夕食時刻でも日付をまたいで余裕を計算する", () => {
    const result = calculateReturnTrip(clonePlan().filter((item) => item.day === 2), spots, { ...defaultReturnSettings, dinnerTime: "00:30" });
    expect(Number.isFinite(result.cases[0].dinnerMargin)).toBe(true);
  });

  it("混雑を施設・駐車場・道路と時間帯に分離する", () => {
    const crowd = crowdDetails(byId("owakudani"));
    expect(crowd.facility.source).not.toBe("realtime");
    expect(crowd.road.level).toBeGreaterThanOrEqual(crowd.facility.level);
    expect(crowd.hourly).toHaveLength(9);
  });
});

describe("共有URL", () => {
  it("共有用データは既定でメモを除外して往復できる", () => {
    const state = defaultState();
    state.itinerary[0].note = "予約番号などの個人メモ";
    const payload = createSharedPayload(state);
    expect(payload.trip.itinerary[0].note).toBeUndefined();
    const url = createShareUrl("https://example.test", "/hakone/", state);
    const encoded = new URL(url).searchParams.get("plan");
    const decoded = decodeSharedPayload(encoded, spots);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.state.itinerary).toHaveLength(state.itinerary.length);
  });

  it("破損・未対応・存在しないスポットの共有URLを安全に拒否する", () => {
    expect(decodeSharedPayload("broken", spots).ok).toBe(false);
    const state = defaultState();
    state.itinerary = [{ ...state.itinerary[0], type: "spot", spotId: "unknown" } as ItineraryItem];
    const url = createShareUrl("https://example.test", "/", state);
    expect(decodeSharedPayload(new URL(url).searchParams.get("plan"), spots).ok).toBe(false);
  });

  it("URL長を通常・長め・警告へ分類する", () => {
    expect(shareUrlLengthLevel(1999)).toBe("normal");
    expect(shareUrlLengthLevel(2000)).toBe("long");
    expect(shareUrlLengthLevel(5000)).toBe("warning");
  });
});
