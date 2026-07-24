import { describe, expect, it } from "vitest";
import { initialPlan } from "@/data/plans";
import { spots } from "@/data/spots";
import { addCustomItemToItinerary, addSpotToItinerary, moveItineraryItemToDay } from "@/lib/itinerary";
import { isValidCoordinates, locationFromSpot, normalizeCustomLocation } from "@/lib/location";
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

  it.each([
    ["meal", "小田原で昼食", 60], ["break", "休憩", 20], ["free", "自由予定", 30],
  ] as const)("%sの地点なし予定を追加し、滞在時間だけを反映する", (type, title, stayMinutes) => {
    const before = calcDaySummary(clonePlan().filter((item) => item.day === 1), spots, "11:15");
    const result = addCustomItemToItinerary(clonePlan(), { type, title, day: 1, stayMinutes, placement: "end" }, `custom-${type}`);
    expect(result.added).toBe(true);
    const item = result.itinerary.find((entry) => entry.id === `custom-${type}`);
    expect(item?.latitude).toBeUndefined();
    const after = calcDaySummary(result.itinerary.filter((entry) => entry.day === 1), spots, "11:15");
    expect(after.stayMinutes).toBe(before.stayMinutes + stayMinutes);
  });

  it.each([
    ["hotel", "宿泊施設", 0], ["rental_car", "レンタカー返却", 30], ["transport", "小田原駅で乗車", 20], ["travel_note", "渋滞注意", 0],
  ] as const)("%sをカスタム予定として追加できる", (type, title, stayMinutes) => {
    const result = addCustomItemToItinerary(clonePlan(), { type, title, day: 2, stayMinutes, placement: "end", subtype: type === "rental_car" ? "return" : undefined, transportMode: type === "transport" ? "train" : undefined, transportAction: type === "transport" ? "board" : undefined }, `custom-${type}`);
    expect(result.added).toBe(true);
    const item = result.itinerary.find((entry) => entry.id === `custom-${type}`);
    expect(item).toMatchObject({ type, title, isCustom: true });
    expect(item?.latitude).toBeUndefined();
  });

  it("追加した宿泊は日別の滞在時間へ加算せず、その日の終了地点にする", () => {
    const result = addCustomItemToItinerary(clonePlan(), { type: "hotel", title: "宿泊施設", day: 1, stayMinutes: 0, placement: "end" }, "custom-hotel");
    const before = calcDaySummary(clonePlan().filter((item) => item.day === 1), spots, "11:15");
    const day = result.itinerary.filter((item) => item.day === 1);
    const after = calcDaySummary(day, spots, "11:15");
    expect(after.stayMinutes).toBe(before.stayMinutes);
    expect(day.at(-1)?.id).toBe("custom-hotel");
  });

  it("既存スポット・小田原駅相当の地点をカスタム予定へ設定して道路経路へ含める", () => {
    const odawara = byId("odawara-station");
    const result = addCustomItemToItinerary(clonePlan(), { type: "rental_car", title: "レンタカー受取", day: 1, stayMinutes: 30, placement: "start", location: locationFromSpot(odawara, "odawara") }, "custom-odawara");
    expect(result.added).toBe(true);
    const item = result.itinerary.find((entry) => entry.id === "custom-odawara");
    expect(item).toMatchObject({ latitude: odawara.latitude, longitude: odawara.longitude, location: { source: "odawara", spotId: "odawara-station" } });
    const summary = calcDaySummary(result.itinerary.filter((entry) => entry.day === 1), spots, "11:15");
    expect(summary.legs.some((leg) => leg?.distanceKm === 0)).toBe(false);
  });

  it("緯度経度を範囲内だけ受け入れ、6桁精度で正規化する", () => {
    expect(isValidCoordinates(35.25691234, 139.15571234)).toBe(true);
    expect(isValidCoordinates(90.1, 139)).toBe(false);
    expect(isValidCoordinates(35, -180.1)).toBe(false);
    expect(normalizeCustomLocation({ name: "手入力", latitude: 35.25691234, longitude: 139.15571234, source: "manual" })).toMatchObject({ latitude: 35.256912, longitude: 139.155712 });
  });

  it("希望時刻を持つカスタム予定は待ち時間を旅程へ反映する", () => {
    const result = addCustomItemToItinerary(clonePlan(), { type: "meal", title: "予約ランチ", day: 1, stayMinutes: 60, placement: "time", requestedArrivalTime: "16:30" }, "custom-time");
    const summary = calcDaySummary(result.itinerary.filter((item) => item.day === 1), spots, "11:15");
    expect(summary.waitMinutes).toBeGreaterThan(0);
  });

  it("不正なカスタム予定を追加しない", () => {
    const result = addCustomItemToItinerary(clonePlan(), { type: "break", title: "", day: 1, stayMinutes: -1, placement: "end" });
    expect(result.added).toBe(false);
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

  it("旧形式の保存データへカスタム予定を追加しても復元できる", () => {
    const state = defaultState();
    state.itinerary.push({ id: "custom-break", day: 2, type: "break", title: "休憩", stayMinutes: 20, order: 99, note: "共有では除外" });
    const restored = restoreTripState(JSON.stringify(serializeTripState(state)), spots, []);
    expect(restored.status).toBe("restored");
    if (restored.status === "restored") expect(restored.saved.data.itinerary.some((item) => item.id === "custom-break")).toBe(true);
  });

  it("新しい交通・レンタカー予定の補足情報を保存データから復元する", () => {
    const state = defaultState();
    state.itinerary.push({ id: "rental-return", day: 2, type: "rental_car", title: "レンタカー返却", stayMinutes: 30, order: 99, isCustom: true, subtype: "return", useForReturnTrip: true });
    state.itinerary.push({ id: "train", day: 2, type: "transport", title: "東京駅へ移動", stayMinutes: 20, order: 100, isCustom: true, transportMode: "train", transportAction: "board", departureTime: "16:30", arrivalTime: "17:10", destinationName: "東京駅" });
    const restored = restoreTripState(JSON.stringify(serializeTripState(state)), spots, []);
    expect(restored.status).toBe("restored");
    if (restored.status === "restored") {
      expect(restored.saved.data.itinerary.find((item) => item.id === "rental-return")?.subtype).toBe("return");
      expect(restored.saved.data.itinerary.find((item) => item.id === "train")).toMatchObject({ transportMode: "train", destinationName: "東京駅" });
    }
  });

  it("地点情報をLocalStorageから復元し、不正な座標のカスタム予定だけを除外する", () => {
    const state = defaultState();
    state.itinerary.push({ id: "located-break", day: 2, type: "break", title: "休憩", stayMinutes: 20, order: 99, isCustom: true, latitude: 35.25, longitude: 139.04, location: { name: "休憩所", latitude: 35.25, longitude: 139.04, source: "manual" } });
    state.itinerary.push({ id: "bad-located-break", day: 2, type: "break", title: "不正", stayMinutes: 20, order: 100, isCustom: true, latitude: 91, longitude: 139, location: { latitude: 91, longitude: 139, source: "manual" } });
    const restored = restoreTripState(JSON.stringify(serializeTripState(state)), spots, []);
    expect(restored.status).toBe("restored");
    if (restored.status === "restored") {
      expect(restored.saved.data.itinerary.find((item) => item.id === "located-break")?.location?.name).toBe("休憩所");
      expect(restored.saved.data.itinerary.some((item) => item.id === "bad-located-break")).toBe(false);
    }
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

  it("共有URLでカスタム交通予定を復元する", () => {
    const state = defaultState();
    state.itinerary.push({ id: "share-transport", day: 2, type: "transport", title: "小田原駅で乗車", stayMinutes: 20, order: 99, isCustom: true, transportMode: "train", transportAction: "board", destinationName: "東京駅" });
    const url = createShareUrl("https://example.test", "/", state);
    const decoded = decodeSharedPayload(new URL(url).searchParams.get("plan"), spots);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.state.itinerary.find((item) => item.id === "share-transport")).toMatchObject({ transportMode: "train", destinationName: "東京駅" });
  });

  it("共有URLで地点情報を復元し、不正な座標を安全に拒否する", () => {
    const state = defaultState();
    state.itinerary.push({ id: "share-location", day: 2, type: "free", title: "買い物", stayMinutes: 30, order: 99, isCustom: true, latitude: 35.25, longitude: 139.04, location: { name: "店舗", latitude: 35.25, longitude: 139.04, source: "manual" } });
    const url = createShareUrl("https://example.test", "/", state);
    const decoded = decodeSharedPayload(new URL(url).searchParams.get("plan"), spots);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.state.itinerary.find((item) => item.id === "share-location")?.location?.name).toBe("店舗");
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
