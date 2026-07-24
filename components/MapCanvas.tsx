"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ItineraryItem, RouteResult, Spot } from "@/types";

type Props = {
  spots: Spot[];
  selectedSpot?: Spot;
  onSelectSpot: (spot: Spot) => void;
  itinerary: ItineraryItem[];
};

const crowdColor: Record<Spot["crowdLevel"], string> = { 1: "#1f9d6a", 2: "#e0a100", 3: "#e45b2b", 4: "#b52d36" };
const routeColors = { 1: "#166cbe", 2: "#8b5cf6" } as const;
const crowdLegend: Array<[Spot["crowdLevel"], string]> = [[1, "比較的空いている"], [2, "やや混雑"], [3, "混雑"], [4, "非常に混雑"]];

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

export default function MapCanvas({ spots, selectedSpot, onSelectSpot, itinerary }: Props) {
  const [routes, setRoutes] = useState<Partial<Record<1 | 2, RouteResult>>>({});
  const [routeStatus, setRouteStatus] = useState<"routing" | "fallback" | "loading">("loading");
  const dayItems = useMemo(() => ({
    1: itinerary.filter((item) => item.day === 1 && item.latitude !== undefined && item.longitude !== undefined).sort((a, b) => a.order - b.order),
    2: itinerary.filter((item) => item.day === 2 && item.latitude !== undefined && item.longitude !== undefined).sort((a, b) => a.order - b.order),
  }), [itinerary]);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      const entries = await Promise.all(([1, 2] as const).map(async (day) => {
        const items = dayItems[day];
        const fallback: RouteResult = {
          geometry: items.map((item) => [item.latitude!, item.longitude!] as [number, number]),
          source: "fallback",
        };
        if (items.length < 2) return [day, fallback] as const;
        try {
          const baseUrl = (process.env.NEXT_PUBLIC_ROUTING_API_URL || "https://router.project-osrm.org").replace(/\/$/, "");
          const coordinates = items.map((item) => `${item.longitude},${item.latitude}`).join(";");
          const response = await fetch(`${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
          if (!response.ok) throw new Error("route unavailable");
          const data = await response.json();
          const route = data?.routes?.[0];
          if (!route?.geometry?.coordinates) throw new Error("route unavailable");
          return [day, { geometry: route.geometry.coordinates.map(([longitude, latitude]: [number, number]) => [latitude, longitude]), source: "routing" }] as const;
        } catch {
          return [day, fallback] as const;
        }
      }));
      if (disposed) return;
      const next = Object.fromEntries(entries) as Partial<Record<1 | 2, RouteResult>>;
      setRoutes(next);
      setRouteStatus(entries.every(([, route]) => route.source === "routing") ? "routing" : "fallback");
    };
    setRouteStatus("loading");
    void load();
    return () => { disposed = true; };
  }, [dayItems]);

  const fitPoints = useMemo(() => [
    ...spots.map((spot) => [spot.latitude, spot.longitude] as [number, number]),
    ...itinerary.filter((item) => item.latitude !== undefined).map((item) => [item.latitude!, item.longitude!] as [number, number]),
  ], [spots, itinerary]);

  return (
    <section className="map-shell" aria-label="箱根周辺の地図">
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
        {([1, 2] as const).map((day) => routes[day]?.geometry && (
          <Polyline key={`route-${day}`} positions={routes[day]!.geometry} pathOptions={{ color: routeColors[day], weight: 5, opacity: 0.85, dashArray: routes[day]!.source === "fallback" ? "8 8" : undefined }} />
        ))}
        {([1, 2] as const).flatMap((day) => dayItems[day].map((item, index) => (
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
      <div className={`route-mode ${routeStatus}`}>
        {routeStatus === "loading" ? "経路を取得中…" : routeStatus === "routing" ? "道路に沿った経路を表示" : "簡易ルートを表示（経路API未接続）"}
      </div>
      {selectedSpot && <div className="map-selected">選択中：{selectedSpot.name}</div>}
    </section>
  );
}
