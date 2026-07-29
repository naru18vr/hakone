"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { createRouteCache, getRoutePresentation } from "@/lib/routing";
import { isSameLocation } from "@/lib/location";
import { buildMapMarkers } from "@/lib/map-markers";
import { tripAvailabilityLabel } from "@/lib/spot-view";
import { CustomLocation, ItineraryItem, RouteMode, RouteResult, Spot } from "@/types";

type RouteModes = Record<1 | 2, RouteMode>;
type Props = {
  spots: Spot[];
  spotCatalog?: Spot[];
  totalSpotCount?: number;
  selectedSpot?: Spot;
  focusRequestId?: number;
  routeDay: 1 | 2 | "all";
  onSelectSpot: (spot: Spot) => void;
  itinerary: ItineraryItem[];
  onRouteModesChange?: (modes: RouteModes) => void;
  locationPickMode?: boolean;
  locationPickCandidate?: CustomLocation;
  onLocationPickCandidate?: (location?: CustomLocation) => void;
  onConfirmLocationPick?: () => void;
  onCancelLocationPick?: () => void;
};

const crowdColor: Record<Spot["crowdLevel"], string> = { 1: "#1f9d6a", 2: "#e0a100", 3: "#e45b2b", 4: "#b52d36" };
const crowdLabel: Record<Spot["crowdLevel"], string> = { 1: "比較的空いている", 2: "やや混雑", 3: "混雑", 4: "非常に混雑" };
const routeColors = { 1: "#166cbe", 2: "#8b5cf6" } as const;
const crowdLegend: Array<[Spot["crowdLevel"], string]> = [[1, "比較的空いている"], [2, "やや混雑"], [3, "混雑"], [4, "非常に混雑"]];
const routeCache = createRouteCache();

const markerIcon = (color: string, number?: number | string, selected = false) => L.divIcon({
  className: "",
  html: `<span class="map-pin${selected ? " is-selected" : ""}" style="--pin:${color}"><i>${number ?? ""}</i></span>`,
  iconSize: selected ? [40, 40] : [30, 30],
  iconAnchor: selected ? [20, 38] : [15, 29],
});
const customMarkerIcon = (day: 1 | 2, number: number, symbol: string, label: string) => L.divIcon({
  className: "",
  html: `<span class="custom-map-pin day-${day}" role="img" aria-label="${label}"><i>${number}</i><b aria-hidden="true">${symbol}</b></span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 12 });
  }, [map, points]);
  return null;
}

function FocusSelectedSpot({ spot, requestId, disabled }: { spot?: Spot; requestId: number; disabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!spot || disabled || requestId === 0) return;
    // ドラッグ直後の慣性移動も止め、同じ行き先の再クリックを含めて
    // 選択地点が必ずその場で地図中央へ来るようにする。
    map.stop();
    map.setView([spot.latitude, spot.longitude], Math.max(map.getZoom(), 14), { animate: false });
  }, [map, spot, requestId, disabled]);
  return null;
}

function LocationPickHandler({ enabled, onPick }: { enabled: boolean; onPick?: (location: CustomLocation) => void }) {
  useMapEvents({ click: (event) => { if (enabled) onPick?.({ latitude: Math.round(event.latlng.lat * 1_000_000) / 1_000_000, longitude: Math.round(event.latlng.lng * 1_000_000) / 1_000_000, source: "map" }); } });
  return null;
}

function SpotPopupContent({ spot, onSelectSpot }: { spot: Spot; onSelectSpot: (spot: Spot) => void }) {
  return (
    <article className="spot-map-popup" aria-label={`${spot.name}の施設情報`}>
      <header>
        <span>{spot.category === "飲食" ? "食事処" : spot.category}</span>
        <h3>{spot.name}</h3>
      </header>
      <p>{spot.description}</p>
      <dl>
        <div><dt>滞在目安</dt><dd>{spot.stayMinutes}分</dd></div>
        {spot.category === "飲食"
          ? <div><dt>価格目安</dt><dd>{spot.priceAdult ?? "要確認"}</dd></div>
          : <div><dt>混雑</dt><dd>{crowdLabel[spot.crowdLevel]}（{spot.crowdSource === "realtime" ? "リアルタイム" : spot.crowdSource === "forecast" ? "予測" : spot.crowdSource === "manual" ? "手動" : "一般傾向"}）</dd></div>}
        <div><dt>駐車場</dt><dd>{spot.parkingAvailable ? `あり${spot.parkingSpaces ? `・${spot.parkingSpaces}` : ""}` : "なし・要確認"}</dd></div>
        <div><dt>雨天</dt><dd>{spot.rainyDayFriendly ? "利用しやすい" : "屋外中心"}</dd></div>
        {spot.openingHours && <div><dt>営業時間</dt><dd>{spot.openingHours}</dd></div>}
        <div><dt>旅行日</dt><dd>{tripAvailabilityLabel(spot)}</dd></div>
      </dl>
      <div className="spot-map-popup-actions">
        <button type="button" onClick={(event) => { event.stopPropagation(); onSelectSpot(spot); }}>詳しい情報を見る</button>
        {(spot.officialUrl || spot.category === "飲食") && <a href={spot.officialUrl ?? `https://tabelog.com/rstLst/?sk=${encodeURIComponent(spot.name)}`} target="_blank" rel="noreferrer">{spot.officialUrl ? "公式サイト" : "食べログ"}</a>}
      </div>
    </article>
  );
}

export default function MapCanvas({ spots, spotCatalog = spots, totalSpotCount, selectedSpot, focusRequestId = 0, routeDay, onSelectSpot, itinerary, onRouteModesChange, locationPickMode = false, locationPickCandidate, onLocationPickCandidate, onConfirmLocationPick, onCancelLocationPick }: Props) {
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
          if (isSameLocation(pair[0], pair[1])) return { geometry: [[pair[0].latitude!, pair[0].longitude!] as [number, number]], source: "routing" } as RouteResult;
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
  const mapMarkers = useMemo(() => buildMapMarkers(itinerary, routeDay), [itinerary, routeDay]);
  const sequenceSpotIds = useMemo(() => new Set(mapMarkers.map((marker) => marker.item.spotId).filter((id): id is string => Boolean(id))), [mapMarkers]);
  const candidateSpots = useMemo(() => spots.filter((spot) => !sequenceSpotIds.has(spot.id)), [spots, sequenceSpotIds]);
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
        <FocusSelectedSpot spot={selectedSpot} requestId={focusRequestId} disabled={locationPickMode} />
        {candidateSpots.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={markerIcon(crowdColor[spot.crowdLevel], undefined, selectedSpot?.id === spot.id)} zIndexOffset={selectedSpot?.id === spot.id ? 1000 : 0}>
            <Tooltip direction="top" offset={[0, selectedSpot?.id === spot.id ? -36 : -27]} opacity={1}>{spot.name}</Tooltip>
            {!locationPickMode && <Popup minWidth={235} maxWidth={285} offset={[0, -28]}>
              <SpotPopupContent spot={spot} onSelectSpot={onSelectSpot} />
            </Popup>}
          </Marker>
        ))}
        {visibleDays.map((day) => routes[day]?.geometry && (
          <Polyline key={`route-${day}`} positions={routes[day]!.geometry} pathOptions={{ color: routeColors[day], weight: 5, opacity: 0.85, dashArray: routes[day]!.source === "fallback" ? "8 8" : undefined }} />
        ))}
        {mapMarkers.map((marker) => {
          const spot = marker.item.spotId ? spotCatalog.find((candidate) => candidate.id === marker.item.spotId) : undefined;
          return (
            <Marker key={`sequence-${marker.item.id}`} position={[marker.item.latitude!, marker.item.longitude!]} icon={marker.isCustom ? customMarkerIcon(marker.day, marker.mapOrder, marker.symbol, marker.ariaLabel) : markerIcon(routeColors[marker.day], marker.mapOrder, selectedSpot?.id === spot?.id)}>
              <Tooltip direction="bottom" offset={[0, 24]} opacity={1}>{marker.day}日目・地図{marker.mapOrder}番　{marker.typeLabel}：{marker.item.title}</Tooltip>
              {spot && !locationPickMode && <Popup minWidth={235} maxWidth={285} offset={[0, -28]}><SpotPopupContent spot={spot} onSelectSpot={onSelectSpot} /></Popup>}
            </Marker>
          );
        })}
        <LocationPickHandler enabled={locationPickMode} onPick={onLocationPickCandidate} />
        {locationPickCandidate && <Marker position={[locationPickCandidate.latitude, locationPickCandidate.longitude]} icon={markerIcon("#166cbe", "?")}><Tooltip permanent direction="top" offset={[0, -28]}>選択地点</Tooltip></Marker>}
      </MapContainer>
      <details className="map-controls">
        <summary>凡例・表示説明</summary>
        <div className="map-legend-body">
          <div className="legend-title">混雑度（予測・一般傾向）</div>
          {crowdLegend.map(([level, label]) => (
            <div className="legend-row" key={level}><span className="legend-dot" style={{ background: crowdColor[level] }} />{label}</div>
          ))}
          <div className="route-key"><span className="route-line day-one" /> 1日目 <span className="route-line day-two" /> 2日目</div>
          <div className="map-marker-legend"><strong>予定マーカー</strong><span>🍴 食事　☕ 休憩　▣ 宿泊</span><span>🚗 レンタカー　🚆 交通　★ 自由予定　✎ メモ</span><small>地図番号は、地図地点が設定された予定のみを対象にしています。地点なし予定は旅程にのみ表示されます。</small></div>
        </div>
      </details>
      <div className="map-result-count">{spots.length} / {totalSpotCount ?? spots.length}件の候補を表示</div>
      <div className={`route-mode ${routeStatus}`} aria-live="polite">
        {routeStatus === "loading" || routeStatus === "slow" ? routePresentation.label : routeModeText}
        {routeStatus === "fallback" && <button onClick={() => setRetryKey((value) => value + 1)}>道路経路を再取得</button>}
      </div>
      {selectedSpot && <button type="button" className="map-selected" onClick={() => onSelectSpot(selectedSpot)}>選択中：{selectedSpot.name}<small>詳細を開く</small></button>}
      {locationPickMode && <div className="location-pick-overlay" role="status" aria-live="assertive"><strong>地点選択モード</strong><span>地図をクリックして予定の場所を選んでください。</span>{locationPickCandidate ? <><small>緯度 {locationPickCandidate.latitude.toFixed(6)} ／ 経度 {locationPickCandidate.longitude.toFixed(6)}</small><div><button className="primary-button" onClick={onConfirmLocationPick}>この地点を使用</button><button className="secondary-button" onClick={() => onLocationPickCandidate?.()}>選び直す</button></div><button className="text-button danger" onClick={onCancelLocationPick}>キャンセル</button></> : <button className="secondary-button" onClick={onCancelLocationPick}>選択を中止</button>}</div>}
    </section>
  );
}
