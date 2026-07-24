"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CalendarDays, CarFront, CheckCircle2, ChevronDown, CircleAlert, CloudRain, ListFilter, MapPinned, RotateCcw, Search, Sparkles, Users } from "lucide-react";
import { hotelPoint, spots as baseSpots } from "@/data/spots";
import { initialPlan, samplePlans } from "@/data/plans";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import SpotDetail from "@/components/SpotDetail";
import { airDistanceKm, assessStress, calcDaySummary, formatEndTime, minutesToText } from "@/lib/trip";
import { CrowdSource, ItineraryItem, SamplePlan, Spot } from "@/types";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), { ssr: false, loading: () => <div className="map-loading">地図を準備しています…</div> });

type FilterKey = "美術館" | "自然" | "絶景" | "湖" | "神社" | "子ども向け" | "雨天対応" | "駐車場あり" | "滞在1時間以内" | "混雑が少ない" | "宿泊施設から近い" | "無料" | "飲食店あり" | "トイレあり";
const filters: FilterKey[] = ["美術館", "自然", "絶景", "湖", "神社", "子ども向け", "雨天対応", "駐車場あり", "滞在1時間以内", "混雑が少ない", "宿泊施設から近い", "無料", "飲食店あり", "トイレあり"];

const crowdSourceLabel: Record<CrowdSource, string> = { realtime: "リアルタイム", forecast: "予測", general: "一般傾向", manual: "手動" };

export default function Home() {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialPlan.itinerary);
  const [selectedSpot, setSelectedSpot] = useState<Spot | undefined>(baseSpots.find((spot) => spot.id === "glass-forest"));
  const [activeDay, setActiveDay] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [crowdMode, setCrowdMode] = useState<"forecast" | "general">("forecast");
  const [visitTime, setVisitTime] = useState("11:30");
  const [weather, setWeather] = useState<"晴れ" | "雨" | "くもり">("晴れ");
  const [hotelName, setHotelName] = useState(hotelPoint.name);
  const [autoPlansVisible, setAutoPlansVisible] = useState(false);

  const spots = useMemo(() => baseSpots.map((spot) => {
    if (crowdMode === "general") return spot;
    const hour = Number(visitTime.slice(0, 2));
    const noonBoost = hour >= 10 && hour < 15 ? 1 : hour >= 15 ? 0 : -1;
    const weatherBoost = weather === "雨" && spot.rainyDayFriendly ? 1 : weather === "雨" && !spot.rainyDayFriendly ? -1 : 0;
    const obonBoost = 1; // 8/12〜13 を想定。リアルタイム値ではない。
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
  const summary1 = calcDaySummary(day1, spots);
  const summary2 = calcDaySummary(day2, spots);
  const stress = assessStress(day1, day2, spots);
  const totalDistance = summary1.distanceKm + summary2.distanceKm;
  const totalDrive = summary1.predictedDriveMinutes + summary2.predictedDriveMinutes;
  const totalStay = summary1.stayMinutes + summary2.stayMinutes;

  const toggleFilter = (filter: FilterKey) => setActiveFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const addSpot = (spot: Spot) => {
    const dayItems = itinerary.filter((item) => item.day === activeDay).sort((a, b) => a.order - b.order);
    const goalIndex = dayItems.findIndex((item) => item.type === "goal" || (activeDay === 1 && item.type === "hotel"));
    const next = {
      id: `${spot.id}-${activeDay}-${Date.now()}`, day: activeDay, type: "spot" as const, spotId: spot.id, title: spot.name, stayMinutes: spot.stayMinutes,
      order: dayItems.length + 1, latitude: spot.latitude, longitude: spot.longitude,
    };
    const reordered = [...dayItems];
    reordered.splice(goalIndex < 0 ? reordered.length : goalIndex, 0, next);
    setItinerary([...itinerary.filter((item) => item.day !== activeDay), ...reordered.map((item, index) => ({ ...item, order: index + 1 }))]);
  };
  const loadPlan = (plan: SamplePlan) => {
    setItinerary(plan.itinerary.map((item) => ({ ...item })));
    setActiveDay(1);
    setAutoPlansVisible(false);
    const firstSpot = plan.itinerary.find((item) => item.spotId);
    setSelectedSpot(spots.find((spot) => spot.id === firstSpot?.spotId));
  };
  const clearItinerary = () => setItinerary([]);
  const resetPlan = () => loadPlan(initialPlan);

  return (
    <main>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">箱</span><div><h1>箱根ゆる旅プランナー</h1><p>距離・混雑・疲れにくさで組み立てる家族旅行</p></div></div>
        <div className="header-badges"><span><CalendarDays size={15} /> 2026.08.12–13</span><span><Users size={15} /> 4人家族</span><span><CarFront size={15} /> レンタカー</span></div>
      </header>

      <div className="app-grid">
        <aside className="sidebar">
          <section className="card trip-card">
            <div className="section-heading"><div><span className="eyebrow">今回の旅</span><h2>旅行条件</h2></div><button className="text-button" onClick={resetPlan}><RotateCcw size={14} /> 初期化</button></div>
            <div className="trip-facts"><span><MapPinned size={15} /> 小田原駅・昼前到着</span><span><BedDoubleIcon /> {hotelName}</span><span><CarFront size={15} /> 13日夕方に小田原へ</span></div>
            <label className="field-label">宿泊施設（仮地点）<input value={hotelName} onChange={(event) => setHotelName(event.target.value)} /></label>
            <p className="muted-note">座標はガラスの森美術館付近に固定した試作です。検索・住所・地図指定は次段階で接続できます。</p>
            <div className="scenario-grid">
              <label>訪問時刻<select value={visitTime} onChange={(event) => setVisitTime(event.target.value)}><option>09:00</option><option>11:30</option><option>14:30</option><option>16:00</option></select></label>
              <label>天候<select value={weather} onChange={(event) => setWeather(event.target.value as "晴れ" | "雨" | "くもり")}><option>晴れ</option><option>くもり</option><option>雨</option></select></label>
            </div>
            <div className="mode-switch"><span>混雑データ</span><button className={crowdMode === "forecast" ? "active" : ""} onClick={() => setCrowdMode("forecast")}>予測</button><button className={crowdMode === "general" ? "active" : ""} onClick={() => setCrowdMode("general")}>一般傾向</button></div>
            <p className="source-note"><CircleAlert size={14} /> {crowdMode === "forecast" ? "8/12・時間帯・天候・お盆を用いた予測です。リアルタイム情報ではありません。" : "過去の一般的な混雑傾向です。リアルタイム情報ではありません。"}</p>
          </section>

          <section className="card spots-card">
            <div className="section-heading"><div><span className="eyebrow">観光地</span><h2>行き先を探す</h2></div><span className="count-badge">{visibleSpots.length}件</span></div>
            <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="観光地・条件を検索" /></label>
            <div className="filter-heading"><ListFilter size={15} /> 絞り込み</div>
            <div className="filter-chips">{filters.map((filter) => <button key={filter} className={activeFilters.includes(filter) ? "active" : ""} onClick={() => toggleFilter(filter)}>{filter}</button>)}</div>
            <div className="spot-list">{visibleSpots.map((spot) => <button key={spot.id} className={`spot-row ${selectedSpot?.id === spot.id ? "selected" : ""}`} onClick={() => setSelectedSpot(spot)}>
              <span className={`crowd-mini l${spot.crowdLevel}`} /><span className="spot-row-content"><strong>{spot.name}</strong><small>{spot.category} · 目安 {spot.stayMinutes}分 · {crowdSourceLabel[spot.crowdSource]}</small></span><ChevronDown size={15} />
            </button>)}</div>
          </section>

          <SpotDetail spot={selectedSpot} distanceFromHotel={selectedSpot ? airDistanceKm(selectedSpot, hotelPoint) * 1.45 : undefined} distanceFromOdawara={selectedSpot ? airDistanceKm(selectedSpot, baseSpots[0]) * 1.65 : undefined} onAdd={addSpot} onClose={() => setSelectedSpot(undefined)} />

          <ItineraryPlanner itinerary={itinerary} spots={spots} activeDay={activeDay} onActiveDayChange={setActiveDay} onChange={setItinerary} onClear={clearItinerary} />

          <section className={`card stress-card ${stress.label}`}>
            <div className="section-heading"><div><span className="eyebrow">ストレス少なめ判定</span><h2>{stress.label}</h2></div><span className="stress-score">負荷 {stress.score}</span></div>
            <p>移動時間、観光地数、混雑度、歩く量、休憩の有無を用いた安全側の目安です。</p>
            <ul>{stress.suggestions.map((suggestion) => <li key={suggestion}><CheckCircle2 size={15} /> {suggestion}</li>)}</ul>
          </section>
        </aside>

        <section className="map-column">
          <MapCanvas spots={visibleSpots} selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} itinerary={itinerary} />
          <section className="route-overview">
            <div><span>合計移動距離</span><strong>{totalDistance.toFixed(1)} km</strong></div><div><span>合計運転時間</span><strong>{minutesToText(totalDrive)}</strong></div><div><span>合計滞在時間</span><strong>{minutesToText(totalStay)}</strong></div><div><span>13日の小田原到着目安</span><strong>{formatEndTime("09:00", summary2.totalMinutes)}</strong></div>
          </section>
          <section className="auto-planner">
            <div><span className="eyebrow">自動プラン作成（β）</span><h2>条件に合わせてたたき台を選ぶ</h2><p>混雑回避・美術館・自然などの方針から、サンプル旅程を読み込みます。</p></div>
            <button className="primary-button" onClick={() => setAutoPlansVisible((value) => !value)}><Sparkles size={17} /> {autoPlansVisible ? "候補を閉じる" : "プラン候補を作成"}</button>
          </section>
          {autoPlansVisible && <div className="auto-plan-grid">{autoPlanCards(samplePlans).map(({ title, description, plan }) => <button className="auto-plan-card" key={title} onClick={() => loadPlan(plan)}><strong>{title}</strong><span>{description}</span><small>{plan.name}を読み込む</small></button>)}</div>}
          <section className="data-disclaimer"><CloudRain size={17} /><div><strong>情報の扱い</strong><p>営業時間・料金・休館日・火山規制・道路状況は変動します。各地点の「公式サイト」で最終確認してください。地図はOpenStreetMap、経路はOSRM互換APIを試行します。リアルタイム渋滞・混雑は未接続です。</p></div></section>
        </section>
      </div>
    </main>
  );
}

function autoPlanCards(plans: SamplePlan[]) {
  const byId = Object.fromEntries(plans.map((plan) => [plan.id, plan]));
  return [
    { title: "最も楽なプラン", description: "仙石原内で完結。移動と判断回数を最小化。", plan: byId.sengokuhara },
    { title: "自然中心プラン", description: "湿生花園・草原を中心に、朝の散策を優先。", plan: byId.sengokuhara },
    { title: "美術館中心プラン", description: "屋内中心で暑さ・雨に対応。", plan: byId["rain-museum"] },
    { title: "箱根らしさ重視", description: "早朝の大涌谷を含む、条件付きの案。", plan: byId.owakudani },
    { title: "雨天対応プラン", description: "天候の影響を受けにくい美術館中心。", plan: byId["rain-museum"] },
    { title: "混雑回避プラン", description: "元箱根中心を避け、湖尻側へ。", plan: byId.lake },
    { title: "子ども優先プラン", description: "短い移動と自然観察でペースを保つ。", plan: byId.sengokuhara },
  ];
}

function BedDoubleIcon() { return <span aria-hidden="true">⌂</span>; }
