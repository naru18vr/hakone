import { ItineraryItem, RouteMode, RouteResult } from "@/types";

export type RoutePresentation = {
  status: "recalculating" | "road" | "estimate";
  label: string;
  detail: string;
};

/** UI とテストで共有する経路取得の経過時間判定。 */
export const routeModeForElapsed = (elapsedMs: number): RouteMode => elapsedMs >= 8000 ? "fallback" : elapsedMs >= 2000 ? "slow" : "loading";

export const getRoutePresentation = (mode: RouteMode): RoutePresentation => {
  if (mode === "loading") return { status: "recalculating", label: "経路を計算中…", detail: "時刻と距離は仮表示です。" };
  if (mode === "slow") return { status: "recalculating", label: "計算に時間がかかっています", detail: "時刻と距離は仮表示です。簡易推計へ自動で切り替えます。" };
  if (mode === "routing") return { status: "road", label: "道路ルート", detail: "道路に沿った経路を表示しています。" };
  return { status: "estimate", label: "簡易推計", detail: "道路経路を取得できないため、直線距離を基に安全側で推計しています。" };
};

export type RouteCacheKey = {
  waypointIds: string[];
  travelMode: "driving";
};

/** セッション中だけ使う、順序を含む道路経路キャッシュキー。 */
export const createRouteCacheKey = (items: ItineraryItem[]): string => {
  const key: RouteCacheKey = {
    waypointIds: items.map((item) => item.spotId ?? item.id),
    travelMode: "driving",
  };
  return `${key.travelMode}:${key.waypointIds.join(">")}`;
};

export const createRouteCache = () => {
  const cache = new Map<string, RouteResult>();
  return {
    get: (items: ItineraryItem[]) => cache.get(createRouteCacheKey(items)),
    set: (items: ItineraryItem[], route: RouteResult) => cache.set(createRouteCacheKey(items), route),
    size: () => cache.size,
  };
};
