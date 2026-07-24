import { RouteMode } from "@/types";

export type RoutePresentation = {
  status: "recalculating" | "road" | "estimate";
  label: string;
  detail: string;
};

export const getRoutePresentation = (mode: RouteMode): RoutePresentation => {
  if (mode === "loading") return { status: "recalculating", label: "再計算中", detail: "新しい旅程の道路経路を取得しています。" };
  if (mode === "routing") return { status: "road", label: "道路ルート", detail: "道路に沿った経路を表示しています。" };
  return { status: "estimate", label: "簡易推計", detail: "道路経路を取得できないため、直線距離を基に安全側で推計しています。" };
};
