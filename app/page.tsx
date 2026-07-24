"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CarFront, CheckCircle2, ChevronDown, CircleAlert, CloudRain, ListFilter, MapPinned, Menu, RotateCcw, Search, Sparkles, Users, X } from "lucide-react";
import { hotelPoint, spots as baseSpots } from "@/data/spots";
import { initialPlan, samplePlans } from "@/data/plans";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import SpotDetail, { AddRequest } from "@/components/SpotDetail";
import { addSpotToItinerary } from "@/lib/itinerary";
import { getRoutePresentation } from "@/lib/routing";
import { restoreTripState, serializeTripState } from "@/lib/storage";
import { airDistanceKm, assessStress, calcTripSummary, formatEndTime, getStressDescription, minutesToText } from "@/lib/trip";
import { CrowdSource, ItineraryItem, RouteMode, SamplePlan, Spot, TripState } from "@/types";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), { ssr: false, loading: () => <div className="map-loading">地図を準備しています…</div> });

type FilterKey = "美術館" | "自然" | "絶景" | "湖" | "神社" | "子ども向け" | "雨天対応" | "駐車場あり" | "滞在1時間以内" | "混雑が少ない" | "宿泊施設から近い" | "無料" | "飲食店あり" | "トイレあり";
const primaryFilters: FilterKey[] = ["混雑が少ない", "子ども向け", "雨天対応", "宿泊施設から近い", "滞在1時間以内"];
const advancedFilters: FilterKey[] = ["美術館", "自然", "絶景", "湖", "神社", "駐車場あり", "無料", "飲食店あり", "トイレあり"];
const crowdSourceLabel: Record<CrowdSource, string> = { realtime: "リアルタイム", forecast: "予測", general: "一般傾向", manual: "手動" };
const STORAGE_KEY = "hakone-yurutabi-planner:v1";

type RouteModes = Record<1 | 2, RouteMode>;

export default function Home() {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialPlan.itinerary);
  const [selectedSpot, setSelectedSpot] = useState<Spot | undefined>(baseSpots.find((spot) => spot.id === "glass-forest"));
  const [activeDay, setActiveDay] = useState<1 | 2>(1);
  const [routeDay, setRouteDay] = useState<1 | 2 | "all">("all");
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [crowdMode, setCrowdMode] = useState<"forecast" | "general">("forecast");
  const [visitTime, setVisitTime] = useState("11:30");
  const [weather, setWeather] = useState<"晴れ" | "雨" | "くもり">("晴れ");
  const [hotelName, setHotelName] = useState(hotelPoint.name);
  const [toast, setToast] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [routeModes, setRouteModes] = useState<RouteModes>({ 1: "loading", 2: "loading" });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const restored = restoreTripState(window.localStorage.getItem(STORAGE_KEY), baseSpots, [...primaryFilters, ...advancedFilters]);
        if (restored.status === "restored") {
          const { data } = restored.saved;
          setItinerary(data.itinerary);
          setHotelName(data.hotelName);
          setActiveDay(data.activeDay);
          setRouteDay(data.routeDay);
          setActiveFilters(data.activeFilters as FilterKey[]);
          setCrowdMode(data.crowdMode);
          setVisitTime(data.visitTime);
          setWeather(data.weather);
          setSelectedSpot(baseSpots.find((spot) => spot.id === data.selectedSpotId));
          setToast("保存した旅程を復元しました");
        } else if (restored.status === "invalid" || restored.status === "unsupported") {
          setToast(`${restored.message} 初期サンプルプランを表示しています。`);
        }
      } catch {
        setToast("保存データを復元できなかったため、初期サンプルプランを表示しています。");
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      const data: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTripState(data)));
    } catch {
      // プライベートブラウズ等で保存できない場合も、画面上の計画は利用できる。
    }
  }, [storageReady, itinerary, hotelName, selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const spots = useMemo(() => baseSpots.map((spot) => {
    if (crowdMode === "general") return spot;
    const hour = Number(visitTime.slice(0, 2));
    const noonBoost = hour >= 10 && hour < 15 ? 1 : hour >= 15 ? 0 : -1;
    const weatherBoost = weather === "雨" && spot.rainyDayFriendly ? 1 : weather === "雨" && !spot.rainyDayFriendly ? -1 : 0;
    const obonBoost = 1;
    return { ...spot, crowdLevel: Math.max(1, Math.min(4, spot.crowdLevel + noonBoost + weatherBoost + obonBoost)) as 1 | 2 | 3 | 4, crowdSource: "forecast" as const, crowdUpdatedAt: `8/12 ${visitTime}想定` };
  }), [crowdMode, visitTime, weather]);

  const visibleSpots = useMemo(() => spots.filter((spot) => {
    const textMatch = spot.name.includes(query) || spot.category.includes(query) || spot.tags.some((tag) => tag.includes(query));
    const filterMatch = activeFilters.every((filter) => {
      if (["美術館", "自然", "絶景", "湖", "神社"].includes(filter)) return spot.category === filter;
      if (filter === "子ども向け") return spot.childFriendly >= 4;
      if (filter === "雨天対応") return spot.rainyDayFriendly;
      if (filter === "駐車場あり") return spot.parkingAvailable;
      if (filter === "滞在1時間以内") return spot.stayMinutes <= 60;
      if (filter === "混雑が少ない") return spot.crowdLevel <= 2;
      if (filter === "宿泊施設から近い") return airDistanceKm(spot, hotelPoint) <= 3;
      if (filter === "無料") return spot.priceAdult === "無料" || spot.priceAdult === "散策無料" || spot.priceAdult === "参拝無料";
      return spot.tags.includes(filter);
    });
    return textMatch && filterMatch;
  }), [spots, query, activeFilters]);

  const day1 = itinerary.filter((item) => item.day === 1).sort((a, b) => a.order - b.order);
  const day2 = itinerary.filter((item) => item.day === 2).sort((a, b) => a.order - b.order);
  const tripSummary = calcTripSummary(day1, day2, spots);
  const summary1 = tripSummary.day1;
  const summary2 = tripSummary.day2;
  const stress = assessStress(day1, day2, spots);
  const loadScore = stress.score;
  const totalDistance = tripSummary.distanceKm;
  const totalDrive = tripSummary.predictedDriveMinutes;
  const totalStay = tripSummary.stayMinutes;
  const isRecalculating = routeModes[1] === "loading" || routeModes[2] === "loading";

  const toggleFilter = (filter: FilterKey) => setActiveFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const updateItinerary = (next: ItineraryItem[]) => {
    setRouteModes({ 1: "loading", 2: "loading" });
    setItinerary(next);
  };
  const addSpot = (spot: Spot, request: AddRequest) => {
    const result = addSpotToItinerary(itinerary, spot, request);
    if (!result.added) {
      setToast(`${spot.name}はすでに旅程へ追加済みです`);
      return;
    }
    updateItinerary(result.itinerary);
    setActiveDay(request.day);
    setRouteDay(request.day);
    setToast(`${spot.name}を8月${request.day === 1 ? "12" : "13"}日に追加しました`);
  };
  const loadPlan = (plan: SamplePlan) => {
    updateItinerary(plan.itinerary.map((item) => ({ ...item })));
    setActiveDay(1);
    setRouteDay("all");
    const firstSpot = plan.itinerary.find((item) => item.spotId);
    setSelectedSpot(spots.find((spot) => spot.id === firstSpot?.spotId));
    setToast(`${plan.name}を読み込みました`);
  };
  const resetPlan = () => {
    if (!window.confirm("保存中の旅程を初期サンプルプランへ戻しますか？ この操作は元に戻せません。")) return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* 保存不可の環境では何もしない */ }
    loadPlan(initialPlan);
    setToast("初期サンプルプランに戻しました");
  };
  const clearItinerary = () => {
    if (!itinerary.length || !window.confirm("旅程をすべて削除しますか？")) return;
    updateItinerary([]);
    setToast("旅程をすべて削除しました");
  };
  const saveTrip = () => {
    try {
      const data: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTripState(data)));
      setToast("この端末に旅程を保存しました");
    } catch {
      setToast("このブラウザでは保存できませんでした");
    }
  };
  const openMobilePanel = (panelId: string) => {
    setMobileSheetOpen(true);
    window.setTimeout(() => document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  return (
    <main>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">箱</span><div><h1>箱根ゆる旅プランナー</h1><p>地図を見ながら、無理のない家族旅行を組み立てる</p></div></div>
        <div className="header-badges"><span><CalendarDays size={15} /> 2026.08.12–13</span><span><Users size={15} /> 4人家族</span><span><CarFront size={15} /> レンタカー</span></div>
      </header>

      <div className={`app-grid ${mobileSheetOpen ? "sheet-open" : ""}`}>
        <aside className="sidebar" aria-label="旅行計画パネル">
          <button className="mobile-sheet-handle" onClick={() => setMobileSheetOpen((value) => !value)} aria-expanded={mobileSheetOpen}><span /><span>{mobileSheetOpen ? "計画パネルを閉じる" : "旅程・観光地を開く"}</span>{mobileSheetOpen ? <X size={16} /> : <Menu size={16} />}</button>
          <section className="card trip-card" id="trip-panel">
            <div className="section-heading"><div><span className="eyebrow">今回の旅</span><h2>旅行条件</h2></div><div className="trip-actions"><button className="text-button" onClick={saveTrip}>保存</button><button className="text-button" onClick={resetPlan}><RotateCcw size={14} /> 初期化</button></div></div>
            <div className="trip-facts"><span><MapPinned size={15} /> 小田原駅・昼前到着</span><span>⌂ {hotelName}</span><span><CarFront size={15} /> 13日夕方に小田原へ</span></div>
            <label className="field-label">宿泊施設（仮地点）<input value={hotelName} onChange={(event) => setHotelName(event.target.value)} /></label>
            <div className="scenario-grid"><label>訪問時刻<select value={visitTime} onChange={(event) => setVisitTime(event.target.value)}><option>09:00</option><option>11:30</option><option>14:30</option><option>16:00</option></select></label><label>天候<select value={weather} onChange={(event) => setWeather(event.target.value as "晴れ" | "雨" | "くもり")}><option>晴れ</option><option>くもり</option><option>雨</option></select></label></div>
            <div className="mode-switch"><span>混雑データ</span><button className={crowdMode === "forecast" ? "active" : ""} onClick={() => setCrowdMode("forecast")}>予測</button><button className={crowdMode === "general" ? "active" : ""} onClick={() => setCrowdMode("general")}>一般傾向</button></div>
            <p className="source-note"><CircleAlert size={14} /> {crowdMode === "forecast" ? "お盆・時間帯・天候を用いた予測です。リアルタイム情報ではありません。" : "一般的な混雑傾向です。リアルタイム情報ではありません。"}</p>
          </section>

          <section className="card spots-card" id="spots-panel">
            <div className="section-heading"><div><span className="eyebrow">観光地</span><h2>行き先を探す</h2></div><span className="count-badge">{visibleSpots.length}件</span></div>
            <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="観光地・条件を検索" /></label>
            <div className="filter-heading"><ListFilter size={15} /> 絞り込み</div>
            <div className="filter-chips">{primaryFilters.map((filter) => <button key={filter} className={activeFilters.includes(filter) ? "active" : ""} onClick={() => toggleFilter(filter)}>{filter === "雨天対応" ? "雨でもOK" : filter === "宿泊施設から近い" ? "宿から近い" : filter}</button>)}</div>
            <details className="advanced-filters"><summary>詳細条件</summary><div className="filter-chips">{advancedFilters.map((filter) => <button key={filter} className={activeFilters.includes(filter) ? "active" : ""} onClick={() => toggleFilter(filter)}>{filter}</button>)}</div></details>
            <div className="spot-list">{visibleSpots.map((spot) => <button key={spot.id} className={`spot-row ${selectedSpot?.id === spot.id ? "selected" : ""}`} onClick={() => { setSelectedSpot(spot); setMobileSheetOpen(true); }}><span className={`crowd-mini l${spot.crowdLevel}`} /><span className="spot-row-content"><strong>{spot.name}</strong><small>{spot.category} · 目安 {spot.stayMinutes}分 · {crowdSourceLabel[spot.crowdSource]}</small></span><ChevronDown size={15} /></button>)}</div>
          </section>

          <SpotDetail key={selectedSpot?.id ?? "empty"} spot={selectedSpot} itinerary={itinerary} distanceFromHotel={selectedSpot ? airDistanceKm(selectedSpot, hotelPoint) * 1.45 : undefined} distanceFromOdawara={selectedSpot ? airDistanceKm(selectedSpot, baseSpots[0]) * 1.65 : undefined} onAdd={addSpot} onClose={() => setSelectedSpot(undefined)} />

          <div className="itinerary-panel" id="itinerary-panel"><ItineraryPlanner itinerary={itinerary} spots={spots} activeDay={activeDay} routeDay={routeDay} routeMode={routeModes[activeDay]} onActiveDayChange={setActiveDay} onRouteDayChange={setRouteDay} onChange={updateItinerary} onClear={clearItinerary} /></div>

          <section className={`card stress-card ${stress.label}`}>
            <div className="section-heading"><div><span className="eyebrow">旅程の負荷</span><h2>{stress.label}</h2></div><span className="stress-score">{loadScore} / 100</span></div>
            <div className="stress-gauge" role="progressbar" aria-label="旅程の負荷スコア" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadScore} aria-valuetext={`負荷 ${loadScore}点、判定 ${stress.label}`}><span aria-hidden="true" style={{ width: `${loadScore}%` }} /><i aria-hidden="true" style={{ left: `${loadScore}%` }} /></div>
            <div className="stress-scale"><span>ゆったり</span><span>忙しい</span></div>
            <p>{getStressDescription(stress.label)}</p>
            <div className="stress-breakdown" aria-label="負荷スコアの内訳">{stress.breakdown.map((item) => <div key={item.label}><span>{item.label}<small>{item.note}</small></span><strong>{item.score}<em>/{item.max}</em></strong></div>)}</div>
            <ul>{stress.suggestions.map((suggestion) => <li key={suggestion}><CheckCircle2 size={15} /> {suggestion}</li>)}</ul>
          </section>

          <section className="route-overview route-overview-panel">
            <div className="overview-heading">日ごと・旅行全体の合計</div>
            <SummaryBlock title="8月12日" summary={summary1} isRecalculating={routeModes[1] === "loading"} />
            <SummaryBlock title="8月13日" summary={summary2} isRecalculating={routeModes[2] === "loading"} />
            <div className={`whole-trip ${isRecalculating ? "is-recalculating" : ""}`}><span>旅行全体</span>{isRecalculating ? <strong>再計算中…</strong> : <><strong>{totalDistance.toFixed(1)} km · 運転 {minutesToText(totalDrive)} · 滞在 {minutesToText(totalStay)}</strong><small>13日の小田原駅到着目安 {formatEndTime("09:00", summary2.totalMinutes)}</small></>}</div>
            <p className="route-source-note">地図経路：1日目 {routeModeLabel(routeModes[1])} ／ 2日目 {routeModeLabel(routeModes[2])}</p>
          </section>

          <details className="optional-tools"><summary><Sparkles size={15} /> サンプルプランを切り替える</summary><div className="auto-plan-grid">{autoPlanCards(samplePlans).map(({ title, description, plan }) => <button className="auto-plan-card" key={title} onClick={() => loadPlan(plan)}><strong>{title}</strong><span>{description}</span></button>)}</div></details>
          <section className="data-disclaimer"><CloudRain size={17} /><div><strong>情報の扱い</strong><p>営業時間・料金・道路状況は変動します。リアルタイム渋滞・混雑は未接続で、推定情報として表示します。</p></div></section>
        </aside>

        <section className="map-column">
          <MapCanvas spots={visibleSpots} selectedSpot={selectedSpot} routeDay={routeDay} onSelectSpot={(spot) => { setSelectedSpot(spot); setMobileSheetOpen(true); }} itinerary={itinerary} onRouteModesChange={setRouteModes} />
        </section>
      </div>
      <nav className={`mobile-bottom-nav ${mobileSheetOpen ? "is-open" : ""}`} aria-label="モバイル用ナビゲーション">
        <button onClick={() => setMobileSheetOpen(false)}><MapPinned size={16} /> 地図</button>
        <button onClick={() => openMobilePanel("spots-panel")}><Search size={16} /> 行き先</button>
        <button onClick={() => openMobilePanel("itinerary-panel")}><CalendarDays size={16} /> 旅程</button>
      </nav>
      {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={17} /> {toast}</div>}
    </main>
  );
}

function routeModeLabel(mode: RouteMode) {
  return getRoutePresentation(mode).label;
}

function SummaryBlock({ title, summary, isRecalculating }: { title: string; summary: ReturnType<typeof calcTripSummary>["day1"]; isRecalculating: boolean }) {
  if (isRecalculating) return <div className="summary-block is-recalculating" aria-live="polite"><strong>{title}</strong><span>距離・時間を再計算中…</span></div>;
  return <div className="summary-block"><strong>{title}</strong><span>走行 {summary.distanceKm.toFixed(1)} km</span><span>通常 {minutesToText(summary.baseDriveMinutes)}</span><span>混雑考慮 {minutesToText(summary.predictedDriveMinutes)}</span><span>滞在 {minutesToText(summary.stayMinutes)}</span>{summary.waitMinutes > 0 && <span>希望時刻待ち {minutesToText(summary.waitMinutes)}</span>}</div>;
}

function autoPlanCards(plans: SamplePlan[]) {
  const byId = Object.fromEntries(plans.map((plan) => [plan.id, plan]));
  return [
    { title: "最も楽なプラン", description: "仙石原内で完結。移動と判断回数を最小化。", plan: byId.sengokuhara },
    { title: "美術館中心", description: "屋内中心で暑さ・雨に対応。", plan: byId["rain-museum"] },
    { title: "箱根らしさ重視", description: "早朝の大涌谷を含む、条件付きの案。", plan: byId.owakudani },
    { title: "混雑回避", description: "元箱根中心を避け、湖尻側へ。", plan: byId.lake },
  ];
}
