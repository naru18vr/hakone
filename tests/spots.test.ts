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
});
