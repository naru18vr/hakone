import { describe, expect, it } from "vitest";
import { spots } from "@/data/spots";
import { crowdDetails } from "@/lib/crowd";
import { forecastCrowdLevel, isSpotOpenOnDay, tripAvailabilityLabel } from "@/lib/spot-view";

const byId = (id: string) => {
  const spot = spots.find((candidate) => candidate.id === id);
  if (!spot) throw new Error(`spot not found: ${id}`);
  return spot;
};

describe("候補表示と旅行日の営業判定", () => {
  it("お盆補正だけで全施設を最高混雑にしない", () => {
    expect(forecastCrowdLevel(byId("susuki"), "11:30", "晴れ")).toBe(1);
    expect(forecastCrowdLevel(byId("wetland-garden"), "11:30", "晴れ")).toBe(2);
    expect(forecastCrowdLevel(byId("glass-forest"), "11:30", "晴れ")).toBe(4);
  });

  it("飲食店だけ昼食時間帯を一段階補正する", () => {
    const restaurant = byId("gin-no-ho");
    expect(forecastCrowdLevel(restaurant, "11:30", "晴れ")).toBeGreaterThan(forecastCrowdLevel(restaurant, "16:00", "晴れ"));
  });

  it("施設・駐車場・道路の補正を二重加点しない", () => {
    const details = crowdDetails({ ...byId("wetland-garden"), crowdLevel: 2 });
    expect(details.facility.level).toBe(2);
    expect(details.parking.level).toBe(1);
    expect(details.road.level).toBe(2);
  });

  it("8月12日・13日の営業可否を同じ定義から表示する", () => {
    const hakoneMuseum = byId("hakone-museum");
    expect(isSpotOpenOnDay(hakoneMuseum, 1)).toBe(false);
    expect(isSpotOpenOnDay(hakoneMuseum, 2)).toBe(false);
    expect(tripAvailabilityLabel(hakoneMuseum)).toBe("8/12・13 休館予定");

    const unchecked = byId("odawara-station");
    expect(isSpotOpenOnDay(unchecked, 1)).toBe(true);
    expect(tripAvailabilityLabel(unchecked)).toBe("8/12・13は公式確認");
  });
});
