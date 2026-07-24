"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { createRouteCache, getRoutePresentation } from "@/lib/routing";
import { ItineraryItem, RouteMode, RouteResult, Spot } from "@/types";

type RouteModes = Record<1 | 2, RouteMode>;
type Props = {
  spots: Spot[];
  selectedSpot?: Spot;
  routeDay: 1 | 2 | "all";
  onSelectSpot: (spot: Spot) => void;
  itinerary: ItineraryItem[];
  onRouteModesChange?: (modes: RouteModes) => void;
};

const crowdColor: Record<Spot["crowdLevel"], string> = { 1: "#1f9d6a", 2: "#e0a100", 3: "#e45b2b", 4: "#b52d36" };
const routeColors = { 1: "#166cbe", 2: "#8b5cf6" } as const;
const crowdLegend: Array<[Spot["crowdLevel"], string]> = [[1, "比較的空いている"], [2, "やや混雑"], [3, "混雑"], [4, "非常に混雑"]];
const routeCache = createRouteCache();

const markerIcon = (color: string, number?: number) => L.divIcon({
  className: "",
  html: `<span class="map-pin" style="--pin:${color}"><i>${number ?? ""}</i></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 29],
});

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export default function MapCanvas({ spots, selectedSpot, routeDay, onSelectSpot, itinerary, onRouteModesChange }: Props) {
  const [routes, setRoutes] = useState<Partial<Record<1 | 2, RouteResult>>>({});
  const [routeModes, setRouteModes] = useState<RouteModes>({ 1: "loading", 2: "loading" });
  const requestId = useRef(0);
  const [retryKey, setRetryKey] = useState(0);
  const dayItems = useMemo(() => ({
    1: itinerary.filter((item) => item.day === 1 && item.latitude !== undefined && item.longitude !== undefined).sort((a, b) => a.order - b.order),
    2: itinerary.filter((item) => item.day === 2 && item.latitude !== undefined && item.longitude !== undefined).sort((a, b) => a.order - b.order),
  }), [itinerary]);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    const controller = new AbortController();
    const load = async () => {
      const entries = await Promise.all(([1, 2] as const).map(async (day) => {
        const items = dayItems[day];
        const fallback: RouteResult = {
          geometry: items.map((item) => [item.latitude!, item.longitude!] as [number, number]),
          source: "fallback",
        };
        if (items.length < 2) return [day, fallback] as const;
        const legs = await Promise.all(items.slice(1).map(async (item, index) => {
          const pair = [items[index], item];
          const cached = routeCache.get(pair);
          if (cached) return cached;
          try {
          const baseUrl = (process.env.NEXT_PUBLIC_ROUTING_API_URL || "https://router.project-osrm.org").replace(/\/$/, "");
          const coordinates = pair.map((point) => `${point.longitude},${point.latitude}`).join(";");
          const response = await fetch(`${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`, { signal: controller.signal });
          if (!response.ok) throw new Error("route unavailable");
          const data = await response.json();
          const route = data?.routes?.[0];
          if (!route?.geometry?.coordinates) throw new Error("route unavailable");
          const roadRoute: RouteResult = { geometry: route.geometry.coordinates.map(([longitude, latitude]: [number, number]) => [latitude, longitude]), source: "routing" };
          routeCache.set(pair, roadRoute);
          return roadRoute;
        } catch (error) {
          if (controller.signal.aborted) throw error;
          return { geometry: pair.map((point) => [point.latitude!, point.longitude!] as [number, number]), source: "fallback" } as RouteResult;
        }
        }));
        const road = legs.every((leg) => leg.source === "routing");
        return [day, { geometry: legs.flatMap((leg, index) => index === 0 ? leg.geometry : leg.geometry.slice(1)), source: road ? "routing" : "fallback" }] as const;
      }));
      if (controller.signal.aborted || currentRequestId !== requestId.current) return;
      const next = Object.fromEntries(entries) as Partial<Record<1 | 2, RouteResult>>;
      const nextModes: RouteModes = { 1: next[1]?.source ?? "fallback", 2: next[2]?.source ?? "fallback" };
      setRoutes(next);
      setRouteModes(nextModes);
      onRouteModesChange?.(nextModes);
    };
    const loadingModes: RouteModes = { 1: "loading", 2: "loading" };
    const loadingTimer = window.setTimeout(() => {
      if (controller.signal.aborted || currentRequestId !== requestId.current) return;
      setRoutes({});
      setRouteModes(loadingModes);
      onRouteModesChange?.(loadingModes);
    }, 0);
    const slowTimer = window.setTimeout(() => {
      if (controller.signal.aborted || currentRequestId !== requestId.current) return;
      const slowModes: RouteModes = { 1: "slow", 2: "slow" };
      setRouteModes(slowModes);
      onRouteModesChange?.(slowModes);
    }, 2000);
    const timeoutTimer = window.setTimeout(() => {
      if (controller.signal.aborted || currentRequestId !== requestId.current) return;
      const fallbackRoutes = Object.fromEntries(([1, 2] as const).map((day) => [day, { geometry: dayItems[day].map((item) => [item.latitude!, item.longitude!] as [number, number]), source: "fallback" }])) as Partial<Record<1 | 2, RouteResult>>;
      const fallbackModes: RouteModes = { 1: "fallback", 2: "fallback" };
      setRoutes(fallbackRoutes);
      setRouteModes(fallbackModes);
      onRouteModesChange?.(fallbackModes);
    }, 8000);
    const timer = window.setTimeout(() => {
      void load().catch(() => {
        if (controller.signal.aborted || currentRequestId !== requestId.current) return;
        const fallbackModes: RouteModes = { 1: "fallback", 2: "fallback" };
        setRouteModes(fallbackModes);
        onRouteModesChange?.(fallbackModes);
      });
    }, 250);
    return () => { window.clearTimeout(loadingTimer); window.clearTimeout(slowTimer); window.clearTimeout(timeoutTimer); window.clearTimeout(timer); controller.abort(); };
  }, [dayItems, onRouteModesChange, retryKey]);

  const fitPoints = useMemo(() => [
    ...spots.map((spot) => [spot.latitude, spot.longitude] as [number, number]),
    ...itinerary.filter((item) => item.latitude !== undefined && (routeDay === "all" || item.day === routeDay)).map((item) => [item.latitude!, item.longitude!] as [number, number]),
  ], [spots, itinerary, routeDay]);
  const visibleDays = routeDay === "all" ? [1, 2] as const : [routeDay] as const;
  const visibleModes = visibleDays.map((day) => routeModes[day]);
  const routeStatus: RouteMode = visibleModes.some((mode) => mode === "loading") ? "loading" : visibleModes.some((mode) => mode === "slow") ? "slow" : visibleModes.every((mode) => mode === "routing") ? "routing" : "fallback";
  const routeModeText = routeStatus === "loading"
    ? "道路経路を取得中…"
    : routeStatus === "routing"
      ? `${routeDay === "all" ? "全日程" : `${routeDay}日目`}の道路ルートを表示`
      : routeDay === "all" && routeModes[1] !== routeModes[2]
        ? "一部は道路ルート、一部は簡易線（API未接続）"
        : "簡易ルートを表示（道路経路API未接続）";
  const routePresentation = getRoutePresentation(routeStatus);

  return (
    <section className="map-shell" id="map-route-panel" role="tabpanel" aria-labelledby={`route-tab-${routeDay}`} aria-label="箱根周辺の地図">
      <MapContainer center={[35.252, 139.035]} zoom={11} scrollWheelZoom className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers points={fitPoints} />
        {spots.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={markerIcon(crowdColor[spot.crowdLevel])} eventHandlers={{ click: () => onSelectSpot(spot) }}>
            <Tooltip direction="top" offset={[0, -27]} opacity={1}>{spot.name}</Tooltip>
          </Marker>
        ))}
        {visibleDays.map((day) => routes[day]?.geometry && (
          <Polyline key={`route-${day}`} positions={routes[day]!.geometry} pathOptions={{ color: routeColors[day], weight: 5, opacity: 0.85, dashArray: routes[day]!.source === "fallback" ? "8 8" : undefined }} />
        ))}
        {visibleDays.flatMap((day) => dayItems[day].map((item, index) => (
          <Marker key={`sequence-${item.id}`} position={[item.latitude!, item.longitude!]} icon={markerIcon(routeColors[day], index + 1)}>
            <Tooltip direction="bottom" offset={[0, 24]} opacity={1}>{day}日目 {index + 1}. {item.title}</Tooltip>
          </Marker>
        )))}
      </MapContainer>
      <div className="map-controls">
        <div className="legend-title">混雑度（予測・一般傾向）</div>
        {crowdLegend.map(([level, label]) => (
          <div className="legend-row" key={level}><span className="legend-dot" style={{ background: crowdColor[level] }} />{label}</div>
        ))}
        <div className="route-key"><span className="route-line day-one" /> 1日目 <span className="route-line day-two" /> 2日目</div>
      </div>
      <div className={`route-mode ${routeStatus}`} aria-live="polite">
        {routeStatus === "loading" || routeStatus === "slow" ? routePresentation.label : routeModeText}
        {routeStatus === "fallback" && <button onClick={() => setRetryKey((value) => value + 1)}>道路経路を再取得</button>}
      </div>
      {selectedSpot && <div className="map-selected">選択中：{selectedSpot.name}</div>}
    </section>
  );
}
