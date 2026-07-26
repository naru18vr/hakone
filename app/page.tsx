"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CarFront, CheckCircle2, ChevronDown, CircleAlert, CloudRain, ListFilter, MapPinned, Menu, Printer, RotateCcw, Search, Share2, Sparkles, Users, X } from "lucide-react";
import { hotelPoint, spots as baseSpots } from "@/data/spots";
import { initialPlan, samplePlans } from "@/data/plans";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import AddSpotDialog from "@/components/AddSpotDialog";
import ShareDialog from "@/components/ShareDialog";
import SpotDetail from "@/components/SpotDetail";
import { AddSpotRequest, addSpotToItinerary } from "@/lib/itinerary";
import { getRoutePresentation } from "@/lib/routing";
import { calculateReturnTrip, defaultReturnSettings } from "@/lib/return-trip";
import { crowdDetails, crowdText } from "@/lib/crowd";
import { decodeSharedPayload, SharedDecodeResult } from "@/lib/share";
import { restoreTripState, serializeTripState } from "@/lib/storage";
import { defaultTravelConditions, partyLabel } from "@/lib/conditions";
import { airDistanceKm, assessStress, calcTripSummary, formatEndTime, getStressDescription, minutesToText } from "@/lib/trip";
import { CustomLocation, ItineraryItem, ReturnSettings, RouteMode, SamplePlan, Spot, TravelConditions, TripState } from "@/types";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), { ssr: false, loading: () => <div className="map-loading">地図を準備しています…</div> });

type FilterKey = "美術館" | "自然" | "絶景" | "湖" | "神社" | "食事処" | "子ども向け" | "雨天対応" | "駐車場あり" | "滞在1時間以内" | "混雑が少ない" | "宿泊施設から近い" | "無料" | "飲食店あり" | "トイレあり";
const primaryFilters: FilterKey[] = ["食事処", "混雑が少ない", "子ども向け", "雨天対応", "宿泊施設から近い", "滞在1時間以内"];
const advancedFilters: FilterKey[] = ["美術館", "自然", "絶景", "湖", "神社", "駐車場あり", "無料", "飲食店あり", "トイレあり"];
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
  const [addDialogSpot, setAddDialogSpot] = useState<Spot | undefined>();
  const [distanceReference, setDistanceReference] = useState<"hotel" | "odawara" | "last" | "selected">("hotel");
  const [spotSort, setSpotSort] = useState<"near" | "drive" | "add" | "crowd" | "child" | "rain" | "stay" | "price">("near");
  const [returnSettings, setReturnSettings] = useState<ReturnSettings>(defaultReturnSettings);
  const [conditions, setConditions] = useState<TravelConditions>(defaultTravelConditions);
  const [shareOpen, setShareOpen] = useState(false);
  const [pendingShare, setPendingShare] = useState<Extract<SharedDecodeResult, { ok: true }> | undefined>();
  const [shareError, setShareError] = useState("");
  const [viewingShared, setViewingShared] = useState(false);
  const [locationPickMode, setLocationPickMode] = useState(false);
  const [locationPickCandidate, setLocationPickCandidate] = useState<CustomLocation | undefined>(undefined);
  const locationPickCommit = useRef<((location: CustomLocation) => void) | undefined>(undefined);

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
          setReturnSettings(data.returnSettings ?? defaultReturnSettings);
          setConditions(data.conditions ?? defaultTravelConditions);
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
    const result = decodeSharedPayload(new URLSearchParams(window.location.search).get("plan"), baseSpots);
    const timer = window.setTimeout(() => {
      if (result.ok) setPendingShare(result);
      else if (new URLSearchParams(window.location.search).has("plan")) setShareError(result.message);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady || viewingShared) return;
    try {
      const data: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather, returnSettings, conditions };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTripState(data)));
    } catch {
      // プライベートブラウズ等で保存できない場合も、画面上の計画は利用できる。
    }
  }, [storageReady, viewingShared, itinerary, hotelName, selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather, returnSettings, conditions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && locationPickMode) { event.preventDefault(); setLocationPickMode(false); setLocationPickCandidate(undefined); locationPickCommit.current = undefined; } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locationPickMode]);

  const spots = useMemo(() => baseSpots.map((spot) => {
    if (crowdMode === "general") return spot;
    const hour = Number(visitTime.slice(0, 2));
    const noonBoost = hour >= 10 && hour < 15 ? 1 : hour >= 15 ? 0 : -1;
    const weatherBoost = weather === "雨" && spot.rainyDayFriendly ? 1 : weather === "雨" && !spot.rainyDayFriendly ? -1 : 0;
    const obonBoost = 1;
    return { ...spot, crowdLevel: Math.max(1, Math.min(4, spot.crowdLevel + noonBoost + weatherBoost + obonBoost)) as 1 | 2 | 3 | 4, crowdSource: "forecast" as const, crowdUpdatedAt: `8/12 ${visitTime}想定` };
  }), [crowdMode, visitTime, weather]);

  const referencePoint = useMemo(() => {
    if (distanceReference === "odawara") return baseSpots.find((spot) => spot.id === "odawara-station") ?? hotelPoint;
    if (distanceReference === "selected" && selectedSpot) return selectedSpot;
    if (distanceReference === "last") return [...itinerary].filter((item) => item.day === activeDay && item.latitude !== undefined).sort((a, b) => b.order - a.order)[0] ?? hotelPoint;
    return hotelPoint;
  }, [distanceReference, selectedSpot, itinerary, activeDay]);
  const visibleSpots = useMemo(() => spots.filter((spot) => {
    const textMatch = spot.name.includes(query) || spot.category.includes(query) || spot.tags.some((tag) => tag.includes(query));
    const filterMatch = activeFilters.every((filter) => {
      if (["美術館", "自然", "絶景", "湖", "神社"].includes(filter)) return spot.category === filter;
      if (filter === "食事処") return spot.category === "飲食";
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
  }).sort((a, b) => {
    const distance = (spot: Spot) => airDistanceKm(spot, referencePoint) * (airDistanceKm(spot, referencePoint) < 3 ? 1.45 : 1.65);
    if (spotSort === "near" || spotSort === "drive") return distance(a) - distance(b);
    if (spotSort === "crowd") return a.crowdLevel - b.crowdLevel;
    if (spotSort === "child") return b.childFriendly - a.childFriendly;
    if (spotSort === "rain") return Number(b.rainyDayFriendly) - Number(a.rainyDayFriendly);
    if (spotSort === "stay") return a.stayMinutes - b.stayMinutes;
    if (spotSort === "price") return Number(a.priceAdult !== "無料") - Number(b.priceAdult !== "無料");
    return a.stayMinutes - b.stayMinutes;
  }), [spots, query, activeFilters, spotSort, referencePoint]);

  const day1 = itinerary.filter((item) => item.day === 1).sort((a, b) => a.order - b.order);
  const day2 = itinerary.filter((item) => item.day === 2).sort((a, b) => a.order - b.order);
  const tripSummary = calcTripSummary(day1, day2, spots, { day1: conditions.day1StartTime, day2: conditions.day2StartTime });
  const summary1 = tripSummary.day1;
  const summary2 = tripSummary.day2;
  const stress = assessStress(day1, day2, spots);
  const loadScore = stress.score;
  const totalDistance = tripSummary.distanceKm;
  const totalDrive = tripSummary.predictedDriveMinutes;
  const totalStay = tripSummary.stayMinutes;
  const isRecalculating = routeModes[1] === "loading" || routeModes[2] === "loading";
  const returnTrip = calculateReturnTrip(day2, spots, returnSettings, conditions.day2StartTime);
  const currentTripState: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather, returnSettings, conditions };

  const toggleFilter = (filter: FilterKey) => setActiveFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const updateItinerary = (next: ItineraryItem[]) => {
    setRouteModes({ 1: "loading", 2: "loading" });
    setItinerary(next);
  };
  const beginLocationPick = (commit: (location: CustomLocation) => void) => {
    locationPickCommit.current = commit;
    setLocationPickCandidate(undefined);
    setLocationPickMode(true);
    setMobileSheetOpen(false);
  };
  const cancelLocationPick = () => { setLocationPickMode(false); setLocationPickCandidate(undefined); locationPickCommit.current = undefined; };
  const confirmLocationPick = () => {
    if (!locationPickCandidate) return;
    locationPickCommit.current?.(locationPickCandidate);
    setLocationPickMode(false);
    setLocationPickCandidate(undefined);
    locationPickCommit.current = undefined;
  };
  const addSpot = (spot: Spot, request: AddSpotRequest) => {
    const result = addSpotToItinerary(itinerary, spot, request);
    if (!result.added) {
      setToast(`${spot.name}はすでに旅程へ追加済みです。別日に入れる場合は追加画面で明示してください。`);
      return;
    }
    updateItinerary(result.itinerary);
    setActiveDay(request.day);
    setRouteDay(request.day);
    setToast(`${spot.name}を8月${request.day === 1 ? "12" : "13"}日に追加しました`);
    setAddDialogSpot(undefined);
  };
  const loadPlan = (plan: SamplePlan) => {
    if (!window.confirm(`${plan.name}を適用すると、現在の旅程を上書きします。続けますか？`)) return;
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
  const addReliefBreak = () => {
    const items = itinerary.filter((item) => item.day === 2);
    const last = items.at(-1);
    updateItinerary([...itinerary, { id: `relief-break-${Date.now()}`, day: 2, type: "break", title: "午後の休憩", stayMinutes: 20, order: items.length + 1, latitude: last?.latitude, longitude: last?.longitude }]);
    setToast("8月13日に20分の休憩を追加しました");
  };
  const saveTrip = () => {
    try {
      const data: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather, returnSettings, conditions };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTripState(data)));
      setToast("この端末に旅程を保存しました");
    } catch {
      setToast("このブラウザでは保存できませんでした");
    }
  };
  const applySharedTrip = (saveToDevice: boolean) => {
    if (!pendingShare) return;
    const shared = pendingShare.state;
    setItinerary(shared.itinerary);
    setHotelName(shared.hotelName);
    setActiveFilters(shared.activeFilters as FilterKey[]);
    setCrowdMode(shared.crowdMode);
    setVisitTime(shared.visitTime);
    setWeather(shared.weather);
    setReturnSettings(shared.returnSettings ?? defaultReturnSettings);
    setConditions(shared.conditions ?? defaultTravelConditions);
    setActiveDay(1); setRouteDay("all"); setRouteModes({ 1: "loading", 2: "loading" });
    setViewingShared(!saveToDevice);
    setPendingShare(undefined);
    setToast(saveToDevice ? "共有旅程を自分の旅程として保存しました" : "共有旅程を一時的に表示しています");
  };
  const openMobilePanel = (panelId: string) => {
    setMobileSheetOpen(true);
    window.setTimeout(() => document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  return (
    <main>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">箱</span><div><h1>箱根ゆる旅プランナー</h1><p>地図を見ながら、無理のない家族旅行を組み立てる</p></div></div>
        <div className="header-badges"><span><CalendarDays size={15} /> {conditions.startDate}–{conditions.endDate.slice(5)}</span><span><Users size={15} /> {conditions.adults + conditions.juniorHighStudents + conditions.elementaryStudents}人</span><span><CarFront size={15} /> {conditions.transport}</span></div>
      </header>

      <div className={`app-grid ${mobileSheetOpen ? "sheet-open" : ""}`}>
        <aside className="sidebar" aria-label="旅行計画パネル">
          <button className="mobile-sheet-handle" onClick={() => setMobileSheetOpen((value) => !value)} aria-expanded={mobileSheetOpen}><span /><span>{mobileSheetOpen ? "計画パネルを閉じる" : "旅程・観光地を開く"}</span>{mobileSheetOpen ? <X size={16} /> : <Menu size={16} />}</button>
          <section className="card trip-card" id="trip-panel">
            <div className="section-heading"><div><span className="eyebrow">今回の旅</span><h2>旅行条件</h2></div><div className="trip-actions"><button className="text-button" onClick={saveTrip}>保存</button><button className="text-button" onClick={() => setShareOpen(true)}><Share2 size={14} /> 共有</button><button className="text-button" onClick={() => window.print()}><Printer size={14} /> 印刷</button><button className="text-button" onClick={() => { setToast("印刷画面で、プリンターとして「PDFに保存」を選択してください。"); window.print(); }}>PDF用画面</button><button className="text-button" onClick={resetPlan}><RotateCcw size={14} /> 初期化</button></div></div>
            <div className="trip-facts"><span><MapPinned size={15} /> {conditions.arrivalPlace}・{conditions.day1StartTime}出発</span><span>⌂ {hotelName}</span><span><CarFront size={15} /> {conditions.planPolicy}</span></div>
            <label className="field-label">宿泊施設（仮地点）<input value={hotelName} onChange={(event) => setHotelName(event.target.value)} /></label>
            <details className="travel-condition-editor" open>
              <summary>日程・出発時刻・旅行条件を編集</summary>
              <div className="scenario-grid">
                <label>開始日<input type="date" value={conditions.startDate} onChange={(event) => setConditions((value) => ({ ...value, startDate: event.target.value }))} /></label>
                <label>終了日<input type="date" value={conditions.endDate} min={conditions.startDate} onChange={(event) => setConditions((value) => ({ ...value, endDate: event.target.value }))} /></label>
                <label>8/12 出発<input type="time" value={conditions.day1StartTime} onChange={(event) => setConditions((value) => ({ ...value, day1StartTime: event.target.value }))} /></label>
                <label>8/13 出発<input type="time" value={conditions.day2StartTime} onChange={(event) => setConditions((value) => ({ ...value, day2StartTime: event.target.value }))} /></label>
                <label>行きの電車 出発<input type="time" value={conditions.outboundTrainDepartureTime} onChange={(event) => setConditions((value) => ({ ...value, outboundTrainDepartureTime: event.target.value }))} /></label>
                <label>行きの電車 所要時間<input type="number" min={1} max={300} value={conditions.outboundTrainMinutes} onChange={(event) => setConditions((value) => ({ ...value, outboundTrainMinutes: Math.min(300, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
                <label>出発・到着地点<input value={conditions.arrivalPlace} onChange={(event) => setConditions((value) => ({ ...value, arrivalPlace: event.target.value }))} /></label>
                <label>移動手段<select value={conditions.transport} onChange={(event) => setConditions((value) => ({ ...value, transport: event.target.value as TravelConditions["transport"] }))}><option>レンタカー</option><option>公共交通</option><option>その他</option></select></label>
                <label>大人<input type="number" min={0} max={20} value={conditions.adults} onChange={(event) => setConditions((value) => ({ ...value, adults: Math.max(0, Number(event.target.value) || 0) }))} /></label>
                <label>中学生<input type="number" min={0} max={20} value={conditions.juniorHighStudents} onChange={(event) => setConditions((value) => ({ ...value, juniorHighStudents: Math.max(0, Number(event.target.value) || 0) }))} /></label>
                <label>小学生<input type="number" min={0} max={20} value={conditions.elementaryStudents} onChange={(event) => setConditions((value) => ({ ...value, elementaryStudents: Math.max(0, Number(event.target.value) || 0) }))} /></label>
                <label>計画方針<input value={conditions.planPolicy} onChange={(event) => setConditions((value) => ({ ...value, planPolicy: event.target.value }))} /></label>
              </div>
              <small>行きの小田原到着見込み：{formatEndTime(conditions.outboundTrainDepartureTime, conditions.outboundTrainMinutes)}（時刻表未接続の概算）<br />{conditions.startDate}〜{conditions.endDate}・{partyLabel(conditions)}。出発時刻を変更すると、旅程の到着・出発時刻と帰京予測を再計算します。</small>
            </details>
            <div className="scenario-grid"><label>訪問時刻<select value={visitTime} onChange={(event) => setVisitTime(event.target.value)}><option>09:00</option><option>11:30</option><option>14:30</option><option>16:00</option></select></label><label>天候<select value={weather} onChange={(event) => setWeather(event.target.value as "晴れ" | "雨" | "くもり")}><option>晴れ</option><option>くもり</option><option>雨</option></select></label></div>
            <div className="mode-switch"><span>混雑データ</span><button className={crowdMode === "forecast" ? "active" : ""} onClick={() => setCrowdMode("forecast")}>予測</button><button className={crowdMode === "general" ? "active" : ""} onClick={() => setCrowdMode("general")}>一般傾向</button></div>
            <p className="source-note"><CircleAlert size={14} /> {crowdMode === "forecast" ? "お盆・時間帯・天候を用いた予測です。リアルタイム情報ではありません。" : "一般的な混雑傾向です。リアルタイム情報ではありません。"}</p>
            <details className="return-settings"><summary>東京での夕食・帰京条件</summary><div className="scenario-grid"><label>夕食予定<input type="time" value={returnSettings.dinnerTime} onChange={(event) => setReturnSettings((value) => ({ ...value, dinnerTime: event.target.value }))} /></label><label>到着希望駅<select value={returnSettings.arrivalStation} onChange={(event) => setReturnSettings((value) => ({ ...value, arrivalStation: event.target.value as ReturnSettings["arrivalStation"] }))}><option>東京駅</option><option>品川駅</option><option>新宿駅</option><option>渋谷駅</option></select></label><label>帰りの電車 所要時間<input type="number" min={1} max={300} value={returnSettings.returnTrainMinutes ?? 40} onChange={(event) => setReturnSettings((value) => ({ ...value, returnTrainMinutes: Math.min(300, Math.max(1, Number(event.target.value) || 1)) }))} /></label><label>返却所要時間<select value={returnSettings.rentalReturnMinutes} onChange={(event) => setReturnSettings((value) => ({ ...value, rentalReturnMinutes: Number(event.target.value) }))}><option value={20}>20分</option><option value={30}>30分</option><option value={40}>40分</option></select></label><label>乗換・遅延余裕<select value={returnSettings.transferMinutes + returnSettings.delayBufferMinutes} onChange={(event) => setReturnSettings((value) => ({ ...value, transferMinutes: Number(event.target.value) - value.delayBufferMinutes }))}><option value={25}>25分</option><option value={35}>35分</option><option value={45}>45分</option></select></label></div><small>小田原駅から{returnSettings.arrivalStation}は概算 {returnTrip.trainEstimate}。実際の列車時刻・乗車時間ではありません。</small></details>
          </section>

          <section className="card spots-card" id="spots-panel">
            <div className="section-heading"><div><span className="eyebrow">観光地</span><h2>行き先を探す</h2></div><span className="count-badge">{visibleSpots.length}件</span></div>
            <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="観光地・条件を検索" /></label>
            <div className="filter-heading"><ListFilter size={15} /> 絞り込み</div>
            <div className="filter-chips">{primaryFilters.map((filter) => <button key={filter} className={activeFilters.includes(filter) ? "active" : ""} onClick={() => toggleFilter(filter)}>{filter === "雨天対応" ? "雨でもOK" : filter === "宿泊施設から近い" ? "宿から近い" : filter}</button>)}</div>
            <details className="advanced-filters"><summary>詳細条件</summary><div className="filter-chips">{advancedFilters.map((filter) => <button key={filter} className={activeFilters.includes(filter) ? "active" : ""} onClick={() => toggleFilter(filter)}>{filter}</button>)}</div></details>
            <div className="distance-reference" aria-label="観光地一覧の距離基準"><span>距離の基準</span>{(["hotel", "odawara", "last", "selected"] as const).map((key) => <button key={key} className={distanceReference === key ? "active" : ""} onClick={() => setDistanceReference(key)}>{({ hotel: "宿泊施設", odawara: "小田原駅", last: "旅程の最後", selected: "選択中" })[key]}</button>)}</div>
            <label className="sort-select">並べ替え<select value={spotSort} onChange={(event) => setSpotSort(event.target.value as typeof spotSort)}><option value="near">基準地点から近い</option><option value="drive">車時間が短い</option><option value="add">追加時間が短い</option><option value="crowd">混雑が少ない</option><option value="child">子ども向け</option><option value="rain">雨天対応</option><option value="stay">滞在時間が短い</option><option value="price">料金が安い</option></select></label>
            <div className="spot-list">{visibleSpots.map((spot) => { const straight = airDistanceKm(spot, referencePoint); const distance = straight * (straight < 3 ? 1.45 : 1.65); const minutes = Math.max(6, Math.round(distance * 2.2 + 4)); const addedDays = [...new Set(itinerary.filter((item) => item.type === "spot" && item.spotId === spot.id).map((item) => item.day))]; const crowd = crowdDetails(spot); return <button key={spot.id} className={`spot-row ${selectedSpot?.id === spot.id ? "selected" : ""}`} onClick={() => { setSelectedSpot(spot); setMobileSheetOpen(true); }}><span className={`crowd-mini l${spot.crowdLevel}`} /><span className="spot-row-content"><strong>{spot.name}</strong><small className="spot-distance">{({ hotel: "宿から", odawara: "小田原駅から", last: "旅程の最後から", selected: "選択中の地点から" })[distanceReference]} 車{minutes}分・{distance.toFixed(1)}km</small>{spot.category === "飲食" ? <small>駐車場 {spot.parkingAvailable ? "あり" : "要確認"} · {spot.priceAdult ?? "料金は公式で確認"}</small> : <small>施設 {crowdText(crowd.facility.level)} · 駐車 {crowdText(crowd.parking.level)} · 道路 {crowdText(crowd.road.level)}</small>}<small>{spot.category} · 滞在 {spot.stayMinutes}分 · 雨天：{spot.rainyDayFriendly ? "◎" : "△"}{addedDays.length ? ` · 8月${addedDays.map((day) => day === 1 ? "12" : "13").join("・")}日に追加済み` : ""}</small></span><ChevronDown size={15} /></button>; })}</div>
          </section>

          <SpotDetail key={selectedSpot?.id ?? "empty"} spot={selectedSpot} itinerary={itinerary} distanceFromHotel={selectedSpot ? airDistanceKm(selectedSpot, hotelPoint) * 1.45 : undefined} distanceFromOdawara={selectedSpot ? airDistanceKm(selectedSpot, baseSpots[0]) * 1.65 : undefined} onOpenAdd={setAddDialogSpot} onClose={() => setSelectedSpot(undefined)} />

          <div className="itinerary-panel" id="itinerary-panel"><ItineraryPlanner itinerary={itinerary} spots={spots} selectedSpot={selectedSpot} activeDay={activeDay} routeDay={routeDay} routeMode={routeModes[activeDay]} dayStartTime={activeDay === 1 ? conditions.day1StartTime : conditions.day2StartTime} locationPickMode={locationPickMode} onStartLocationPick={beginLocationPick} onCancelLocationPick={cancelLocationPick} onActiveDayChange={setActiveDay} onRouteDayChange={setRouteDay} onChange={updateItinerary} onClear={clearItinerary} /></div>

          <section className={`card stress-card ${stress.label}`}>
            <div className="section-heading"><div><span className="eyebrow">旅程の負荷</span><h2>{stress.label}</h2></div><span className="stress-score">{loadScore} / 100</span></div>
            <div className="stress-gauge" role="progressbar" aria-label="旅程の負荷スコア" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadScore} aria-valuetext={`負荷 ${loadScore}点、判定 ${stress.label}`}><span aria-hidden="true" style={{ width: `${loadScore}%` }} /><i aria-hidden="true" style={{ left: `${loadScore}%` }} /></div>
            <div className="stress-scale"><span>ゆったり</span><span>忙しい</span></div>
            <p>{getStressDescription(stress.label)}</p>
            <div className="daily-stress" aria-label="日ごとの負荷"><span>8月12日 <strong>{stress.days[1].score} / 100</strong> {stress.days[1].label}</span><span>8月13日 <strong>{stress.days[2].score} / 100</strong> {stress.days[2].label}</span></div>
            <div className="stress-breakdown" aria-label="旅行全体の負荷内訳">{stress.days[activeDay].breakdown.map((item) => <div key={item.label}><span>{item.label}<small>{item.note}</small></span><strong>{item.score}<em>/{item.max}</em></strong></div>)}</div>
            <ul>{stress.suggestions.map((suggestion) => <li key={suggestion}><CheckCircle2 size={15} /><span>{suggestion}{suggestion.includes("休憩") && <button className="text-button" onClick={addReliefBreak}>20分の休憩を追加</button>}{suggestion.includes("小田原") && <button className="text-button" onClick={() => { const last = [...day2].reverse().find((item) => item.type === "spot"); if (last) updateItinerary(itinerary.filter((item) => item.id !== last.id)); }}>最後の観光地を外す</button>}</span></li>)}</ul>
          </section>

          <section className="route-overview route-overview-panel">
            <div className="overview-heading">日ごと・旅行全体の合計</div>
            <SummaryBlock title="8月12日" summary={summary1} isRecalculating={routeModes[1] === "loading"} />
            <SummaryBlock title="8月13日" summary={summary2} isRecalculating={routeModes[2] === "loading"} />
            <div className={`whole-trip ${isRecalculating ? "is-recalculating" : ""}`}><span>旅行全体</span>{isRecalculating ? <strong>再計算中…</strong> : <><strong>{totalDistance.toFixed(1)} km · 運転 {minutesToText(totalDrive)} · 滞在 {minutesToText(totalStay)}</strong><small>2日目の小田原駅到着目安 {formatEndTime(conditions.day2StartTime, summary2.totalMinutes)}</small></>}</div>
            <p className="route-source-note">地図経路：1日目 {routeModeLabel(routeModes[1])} ／ 2日目 {routeModeLabel(routeModes[2])}</p>
          </section>

          <section className="card return-card">
            <div className="section-heading"><div><span className="eyebrow">8月13日の帰京予測</span><h2>{returnSettings.dinnerTime}の夕食に間に合う？</h2></div><span className={`return-verdict ${returnTrip.cases[0].verdict}`}>{returnTrip.cases[0].verdict}</span></div>
            <div className="return-cases">{returnTrip.cases.map((entry) => <div key={entry.label}><strong>{entry.label}</strong><span>小田原着 {entry.stationArrival} · 返却完了 {entry.returnComplete}</span><span>{returnSettings.arrivalStation}着 {entry.tokyoArrival}</span><b>夕食まで {entry.dinnerMargin >= 0 ? minutesToText(entry.dinnerMargin) : `${minutesToText(-entry.dinnerMargin)}超過`}</b><small>{entry.verdict}</small></div>)}</div>
            <p className="muted-note">仙石原側の小田原駅到着推奨：通常 {returnTrip.recommendedStationArrival[0]}まで／混雑 {returnTrip.recommendedStationArrival[1]}まで／安全重視 {returnTrip.recommendedStationArrival[2]}まで<br />電車時間はリアルタイム時刻表ではなく、乗車時間のみの一般的な所要時間による概算です。乗換余裕・遅延用予備は別途加算しています。実際の列車時刻、運休、遅延は公式情報をご確認ください。</p>
            {returnTrip.cases[1].dinnerMargin < 30 && <button className="secondary-button" onClick={() => { const last = [...day2].reverse().find((item) => item.type === "spot"); if (last) { updateItinerary(itinerary.filter((item) => item.id !== last.id)); setToast(`${last.title}を外し、帰京余裕を再計算しました`); } }}>最後の観光地を外す</button>}
          </section>

          <details className="optional-tools"><summary><Sparkles size={15} /> サンプルプランを比較して適用</summary><div className="auto-plan-grid">{autoPlanCards(samplePlans, spots, returnSettings).map(({ title, description, plan, metrics }) => <button className="auto-plan-card" key={title} onClick={() => loadPlan(plan)}><strong>{title}</strong><span>{description}</span><small>走行 {metrics.distance.toFixed(1)}km · 混雑考慮 {minutesToText(metrics.drive)}</small><small>日別負荷 {metrics.day1} / {metrics.day2} · 東京着 {metrics.tokyo}</small><em>このプランを適用</em></button>)}</div></details>
          <section className="data-disclaimer"><CloudRain size={17} /><div><strong>情報の扱い</strong><p>営業時間・料金・道路状況は変動します。リアルタイム渋滞・混雑は未接続で、推定情報として表示します。</p></div></section>
        </aside>

        <section className="map-column">
          <MapCanvas spots={visibleSpots} selectedSpot={selectedSpot} routeDay={routeDay} onSelectSpot={(spot) => { setSelectedSpot(spot); setMobileSheetOpen(true); }} itinerary={itinerary} onRouteModesChange={setRouteModes} locationPickMode={locationPickMode} locationPickCandidate={locationPickCandidate} onLocationPickCandidate={setLocationPickCandidate} onConfirmLocationPick={confirmLocationPick} onCancelLocationPick={cancelLocationPick} />
        </section>
      </div>
      <nav className={`mobile-bottom-nav ${mobileSheetOpen ? "is-open" : ""} ${locationPickMode ? "is-location-picking" : ""}`} aria-label="モバイル用ナビゲーション">
        <button onClick={() => setMobileSheetOpen(false)}><MapPinned size={16} /> 地図</button>
        <button onClick={() => openMobilePanel("spots-panel")}><Search size={16} /> 行き先</button>
        <button onClick={() => openMobilePanel("itinerary-panel")}><CalendarDays size={16} /> 旅程</button>
      </nav>
      {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={17} /> {toast}</div>}
      {shareError && <div className="toast" role="alert"><CircleAlert size={17} /> {shareError}</div>}
      {addDialogSpot && <AddSpotDialog spot={addDialogSpot} itinerary={itinerary} spots={spots} returnSettings={returnSettings} onConfirm={(request) => addSpot(addDialogSpot, request)} onRemoveExisting={() => { const next = itinerary.filter((item) => !(item.type === "spot" && item.spotId === addDialogSpot.id)); updateItinerary(next); setToast(`${addDialogSpot.name}を旅程から削除しました`); }} onViewExisting={() => { const day = itinerary.find((item) => item.type === "spot" && item.spotId === addDialogSpot.id)?.day; if (day) { setActiveDay(day); setRouteDay(day); window.setTimeout(() => document.getElementById("itinerary-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); } }} onClose={() => setAddDialogSpot(undefined)} />}
      {shareOpen && <ShareDialog state={currentTripState} onClose={() => setShareOpen(false)} onToast={setToast} />}
      {pendingShare && <div className="dialog-backdrop"><section className="add-dialog shared-prompt" role="dialog" aria-modal="true" aria-labelledby="shared-prompt-title"><div className="dialog-heading"><div><span className="eyebrow">共有された旅程</span><h2 id="shared-prompt-title">共有旅程を開きますか？</h2></div></div><p>2026年8月12日〜13日 · 4人 · 観光地 {pendingShare.state.itinerary.filter((item) => item.type === "spot").length}件</p><p>東京駅到着予測は、適用後に現在の混雑設定で再計算します。</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setPendingShare(undefined)}>現在の旅程を維持</button><button className="secondary-button" onClick={() => applySharedTrip(false)}>一時的に見る</button><button className="primary-button" onClick={() => applySharedTrip(true)}>自分の旅程として保存</button></div></section></div>}
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

function autoPlanCards(plans: SamplePlan[], spots: Spot[], returnSettings: ReturnSettings) {
  const byId = Object.fromEntries(plans.map((plan) => [plan.id, plan]));
  return [
    { title: "最も楽なプラン", description: "仙石原内で完結。移動と判断回数を最小化。", plan: byId.sengokuhara },
    { title: "美術館中心", description: "屋内中心で暑さ・雨に対応。", plan: byId["rain-museum"] },
    { title: "箱根らしさ重視", description: "早朝の大涌谷を含む、条件付きの案。", plan: byId.owakudani },
    { title: "混雑回避", description: "元箱根中心を避け、湖尻側へ。", plan: byId.lake },
  ].map((item) => {
    const day1 = item.plan.itinerary.filter((entry) => entry.day === 1);
    const day2 = item.plan.itinerary.filter((entry) => entry.day === 2);
    const summary = calcTripSummary(day1, day2, spots);
    const stress = assessStress(day1, day2, spots);
    const returnTrip = calculateReturnTrip(day2, spots, returnSettings);
    return { ...item, metrics: { distance: summary.distanceKm, drive: summary.predictedDriveMinutes, day1: stress.days[1].score, day2: stress.days[2].score, tokyo: returnTrip.cases[0].tokyoArrival } };
  });
}
