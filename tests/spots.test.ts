import { describe, expect, it } from "vitest";
import { spots } from "@/data/spots";

describe("観光地・食事処データ", () => {
  it("IDが重複していない", () => {
    const ids = spots.map((spot) => spot.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("全施設に有効な座標とHTTPSの参照先がある", () => {
    for (const spot of spots) {
      expect(spot.latitude).toBeGreaterThanOrEqual(-90);
      expect(spot.latitude).toBeLessThanOrEqual(90);
      expect(spot.longitude).toBeGreaterThanOrEqual(-180);
      expect(spot.longitude).toBeLessThanOrEqual(180);
      expect(spot.officialUrl).toMatch(/^https:\/\//);
    }
  });

  it("食事処には価格目安と駐車場情報がある", () => {
    const restaurants = spots.filter((spot) => spot.category === "飲食");
    expect(restaurants.length).toBeGreaterThanOrEqual(20);

    for (const restaurant of restaurants) {
      expect(restaurant.priceAdult).toBeTruthy();
      expect(restaurant.parkingAvailable).toBe(true);
      expect(restaurant.parkingSpaces).toBeTruthy();
    }
  });

  it("公式確認済みの主要施設は2026年旅行日の営業可否と最新情報を保持する", () => {
    const byId = (id: string) => spots.find((spot) => spot.id === id);
    expect(byId("glass-forest")).toMatchObject({
      openingHours: "10:00〜17:30（入館は17:00まで）",
      tripOpenDays: [1, 2],
      factCheckedAt: "2026-07-29",
    });
    expect(byId("lalique")).toMatchObject({ tripOpenDays: [1, 2], closedDays: expect.stringContaining("1/13〜1/23") });
    expect(byId("wetland-garden")).toMatchObject({ tripOpenDays: [1, 2], parkingSpaces: expect.stringContaining("90台") });
    expect(byId("pola")).toMatchObject({ tripOpenDays: [1, 2], priceAdult: "2,200円" });
    expect(byId("open-air-museum")).toMatchObject({ tripOpenDays: [1, 2], priceAdult: "2,000円（WEB 1,800円）" });
    expect(byId("hakone-museum")).toMatchObject({
      tripOpenDays: [],
      closedDays: expect.stringContaining("2026/5/7〜10/29全面休館"),
    });
  });

  it("変動する口コミ点数を固定値として保存しない", () => {
    for (const restaurant of spots.filter((spot) => spot.category === "飲食")) {
      expect(restaurant.reviewScore ?? "").not.toMatch(/食べログ参考\s*\d/);
    }
  });
});
