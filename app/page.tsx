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

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), { ssr: false, loading: () => <div className="map-loading">åœ°å›³ã‚’æº–å‚™ã—ã¦ã„ã¾ã™â€¦</div> });

type FilterKey = "ç¾Žè¡“é¤¨" | "è‡ªç„¶" | "çµ¶æ™¯" | "æ¹–" | "ç¥žç¤¾" | "é£Ÿäº‹å‡¦" | "å­ã©ã‚‚å‘ã‘" | "é›¨å¤©å¯¾å¿œ" | "é§è»Šå ´ã‚ã‚Š" | "æ»žåœ¨1æ™‚é–“ä»¥å†…" | "æ··é›‘ãŒå°‘ãªã„" | "å®¿æ³Šæ–½è¨­ã‹ã‚‰è¿‘ã„" | "ç„¡æ–™" | "é£²é£Ÿåº—ã‚ã‚Š" | "ãƒˆã‚¤ãƒ¬ã‚ã‚Š";
const primaryFilters: FilterKey[] = ["é£Ÿäº‹å‡¦", "æ··é›‘ãŒå°‘ãªã„", "å­ã©ã‚‚å‘ã‘", "é›¨å¤©å¯¾å¿œ", "å®¿æ³Šæ–½è¨­ã‹ã‚‰è¿‘ã„", "æ»žåœ¨1æ™‚é–“ä»¥å†…"];
const advancedFilters: FilterKey[] = ["ç¾Žè¡“é¤¨", "è‡ªç„¶", "çµ¶æ™¯", "æ¹–", "ç¥žç¤¾", "é§è»Šå ´ã‚ã‚Š", "ç„¡æ–™", "é£²é£Ÿåº—ã‚ã‚Š", "ãƒˆã‚¤ãƒ¬ã‚ã‚Š"];
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
  const [weather, setWeather] = useState<"æ™´ã‚Œ" | "é›¨" | "ãã‚‚ã‚Š">("æ™´ã‚Œ");
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
          setToast("ä¿å­˜ã—ãŸæ—…ç¨‹ã‚’å¾©å…ƒã—ã¾ã—ãŸ");
        } else if (restored.status === "invalid" || restored.status === "unsupported") {
          setToast(`${restored.message} åˆæœŸã‚µãƒ³ãƒ—ãƒ«ãƒ—ãƒ©ãƒ³ã‚’è¡¨ç¤ºã—ã¦ã„ã¾ã™ã€‚`);
        }
      } catch {
        setToast("ä¿å­˜ãƒ‡ãƒ¼ã‚¿ã‚’å¾©å…ƒã§ããªã‹ã£ãŸãŸã‚ã€åˆæœŸã‚µãƒ³ãƒ—ãƒ«ãƒ—ãƒ©ãƒ³ã‚’è¡¨ç¤ºã—ã¦ã„ã¾ã™ã€‚");
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
      // ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆãƒ–ãƒ©ã‚¦ã‚ºç­‰ã§ä¿å­˜ã§ããªã„å ´åˆã‚‚ã€ç”»é¢ä¸Šã®è¨ˆç”»ã¯åˆ©ç”¨ã§ãã‚‹ã€‚
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
    const weatherBoost = weather === "é›¨" && spot.rainyDayFriendly ? 1 : weather === "é›¨" && !spot.rainyDayFriendly ? -1 : 0;
    const obonBoost = 1;
    return { ...spot, crowdLevel: Math.max(1, Math.min(4, spot.crowdLevel + noonBoost + weatherBoost + obonBoost)) as 1 | 2 | 3 | 4, crowdSource: "forecast" as const, crowdUpdatedAt: `8/12 ${visitTime}æƒ³å®š` };
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
      if (["ç¾Žè¡“é¤¨", "è‡ªç„¶", "çµ¶æ™¯", "æ¹–", "ç¥žç¤¾"].includes(filter)) return spot.category === filter;
      if (filter === "é£Ÿäº‹å‡¦") return spot.category === "é£²é£Ÿ";
      if (filter === "å­ã©ã‚‚å‘ã‘") return spot.childFriendly >= 4;
      if (filter === "é›¨å¤©å¯¾å¿œ") return spot.rainyDayFriendly;
      if (filter === "é§è»Šå ´ã‚ã‚Š") return spot.parkingAvailable;
      if (filter === "æ»žåœ¨1æ™‚é–“ä»¥å†…") return spot.stayMinutes <= 60;
      if (filter === "æ··é›‘ãŒå°‘ãªã„") return spot.crowdLevel <= 2;
      if (filter === "å®¿æ³Šæ–½è¨­ã‹ã‚‰è¿‘ã„") return airDistanceKm(spot, hotelPoint) <= 3;
      if (filter === "ç„¡æ–™") return spot.priceAdult === "ç„¡æ–™" || spot.priceAdult === "æ•£ç­–ç„¡æ–™" || spot.priceAdult === "å‚æ‹ç„¡æ–™";
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
    if (spotSort === "price") return Number(a.priceAdult !== "ç„¡æ–™") - Number(b.priceAdult !== "ç„¡æ–™");
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
      setToast(`${spot.name}ã¯ã™ã§ã«æ—…ç¨‹ã¸è¿½åŠ æ¸ˆã¿ã§ã™ã€‚åˆ¥æ—¥ã«å…¥ã‚Œã‚‹å ´åˆã¯è¿½åŠ ç”»é¢ã§æ˜Žç¤ºã—ã¦ãã ã•ã„ã€‚`);
      return;
    }
    updateItinerary(result.itinerary);
    setActiveDay(request.day);
    setRouteDay(request.day);
    setToast(`${spot.name}ã‚’8æœˆ${request.day === 1 ? "12" : "13"}æ—¥ã«è¿½åŠ ã—ã¾ã—ãŸ`);
    setAddDialogSpot(undefined);
  };
  const loadPlan = (plan: SamplePlan) => {
    if (!window.confirm(`${plan.name}ã‚’é©ç”¨ã™ã‚‹ã¨ã€ç¾åœ¨ã®æ—…ç¨‹ã‚’ä¸Šæ›¸ãã—ã¾ã™ã€‚ç¶šã‘ã¾ã™ã‹ï¼Ÿ`)) return;
    updateItinerary(plan.itinerary.map((item) => ({ ...item })));
    setActiveDay(1);
    setRouteDay("all");
    const firstSpot = plan.itinerary.find((item) => item.spotId);
    setSelectedSpot(spots.find((spot) => spot.id === firstSpot?.spotId));
    setToast(`${plan.name}ã‚’èª­ã¿è¾¼ã¿ã¾ã—ãŸ`);
  };
  const resetPlan = () => {
    if (!window.confirm("ä¿å­˜ä¸­ã®æ—…ç¨‹ã‚’åˆæœŸã‚µãƒ³ãƒ—ãƒ«ãƒ—ãƒ©ãƒ³ã¸æˆ»ã—ã¾ã™ã‹ï¼Ÿ ã“ã®æ“ä½œã¯å…ƒã«æˆ»ã›ã¾ã›ã‚“ã€‚")) return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ä¿å­˜ä¸å¯ã®ç’°å¢ƒã§ã¯ä½•ã‚‚ã—ãªã„ */ }
    loadPlan(initialPlan);
    setToast("åˆæœŸã‚µãƒ³ãƒ—ãƒ«ãƒ—ãƒ©ãƒ³ã«æˆ»ã—ã¾ã—ãŸ");
  };
  const clearItinerary = () => {
    if (!itinerary.length || !window.confirm("æ—…ç¨‹ã‚’ã™ã¹ã¦å‰Šé™¤ã—ã¾ã™ã‹ï¼Ÿ")) return;
    updateItinerary([]);
    setToast("æ—…ç¨‹ã‚’ã™ã¹ã¦å‰Šé™¤ã—ã¾ã—ãŸ");
  };
  const addReliefBreak = () => {
    const items = itinerary.filter((item) => item.day === 2);
    const last = items.at(-1);
    updateItinerary([...itinerary, { id: `relief-break-${Date.now()}`, day: 2, type: "break", title: "åˆå¾Œã®ä¼‘æ†©", stayMinutes: 20, order: items.length + 1, latitude: last?.latitude, longitude: last?.longitude }]);
    setToast("8æœˆ13æ—¥ã«20åˆ†ã®ä¼‘æ†©ã‚’è¿½åŠ ã—ã¾ã—ãŸ");
  };
  const saveTrip = () => {
    try {
      const data: TripState = { itinerary, hotelName, selectedSpotId: selectedSpot?.id, activeDay, routeDay, activeFilters, crowdMode, visitTime, weather, returnSettings, conditions };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTripState(data)));
      setToast("ã“ã®ç«¯æœ«ã«æ—…ç¨‹ã‚’ä¿å­˜ã—ã¾ã—ãŸ");
    } catch {
      setToast("ã“ã®ãƒ–ãƒ©ã‚¦ã‚¶ã§ã¯ä¿å­˜ã§ãã¾ã›ã‚“ã§ã—ãŸ");
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
    setToast(saveToDevice ? "å…±æœ‰æ—…ç¨‹ã‚’è‡ªåˆ†ã®æ—…ç¨‹ã¨ã—ã¦ä¿å­˜ã—ã¾ã—ãŸ" : "å…±æœ‰æ—…ç¨‹ã‚’ä¸€æ™‚çš„ã«è¡¨ç¤ºã—ã¦ã„ã¾ã™");
  };
  const openMobilePanel = (panelId: string) => {
    setMobileSheetOpen(true);
    window.setTimeout(() => document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  return (
    <main>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">ç®±</span><div><h1>ç®±æ ¹ã‚†ã‚‹æ—…ãƒ—ãƒ©ãƒ³ãƒŠãƒ¼</h1><p>åœ°å›³ã‚’è¦‹ãªãŒã‚‰ã€ç„¡ç†ã®ãªã„å®¶æ—æ—…è¡Œã‚’çµ„ã¿ç«‹ã¦ã‚‹</p></div></div>
        <div className="header-badges"><span><CalendarDays size={15} /> {conditions.startDate}â€“{conditions.endDate.slice(5)}</span><span><Users size={15} /> {conditions.adults + conditions.juniorHighStudents×½:¶‰žËkºwµçO^Ýš\Ú][Y_HÛÚ[™ÙO^Ê]™[
HOˆÙ]š\Ú][YJ]™[\™Ù]˜[YJ_OÜ[ÛŒNŒÛÜ[ÛÜ[ÛŒLNŒÌÛÜ[ÛÜ[ÛŒMŒÌÛÜ[ÛÜ[ÛŒMŽŒÛÜ[ÛÜÙ[XÝÛX™[X™[¹i*y`&OÙ[XÝ˜[YO^ÝÙX]\ŸHÛÚ[™ÙO^Ê]™[
HOˆÙ]ÙX]\Š]™[\™Ù]˜[YH\È¹¦m8à£ˆºfêˆ¸àcøà ¸à¢ˆŠ_OÜ[Û¹¦m8à£ÛÜ[ÛÜ[Û¸àcøà ¸à¢ÛÜ[ÛÜ[ÛºfêÛÜ[ÛÜÙ[XÝÛX™[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOH›[ÙK\ÝÚ]ÚÜ[¹­íúfäxàáøàï8à¯ÏÜÜ[]ÛˆÛ\ÜÓ˜[YO^ØÜ›ÝÙ[ÙHOOH™›Ü™XØ\ÝˆÈ˜XÝ]™HˆˆˆŸHÛÛXÚÏ^Ê
HOˆÙ]Ü›ÝÙ[ÙJ™›Ü™XØ\ÝŠ_O¹.¢9®+Ø]Û]ÛˆÛ\ÜÓ˜[YO^ØÜ›ÝÙ[ÙHOOH™Ù[™\˜[ˆÈ˜XÝ]™HˆˆˆŸHÛÛXÚÏ^Ê
HOˆÙ]Ü›ÝÙ[ÙJ™Ù[™\˜[Š_O¹. :"+9`¯¹d$OØ]ÛÙ]‚ˆÛ\ÜÓ˜[YOHœÛÝ\˜ÙK[›ÝHÚ\˜ÛP[\Ú^™O^ÌMHÏˆØÜ›ÝÙ[ÙHOOH™›Ü™XØ\ÝˆÈ¸àb¹æá¸àîù¦`ºe¤ùn+øàîùi*y`&xà¤¹å*8àa8àgù.¢9®+8àiøàfxà ¸àê¸à¨¸àêøà¯øà©8àè9 áyh,xàiøàkøà`¸à¢¸ào¸àføà¤øà ˆˆˆ¹. :"+9æ¡8àj¹­íúfäy`¯¹d$xàiøàfxà ¸àê¸à¨¸àêøà¯øà©8àè9 áyh,xàiøàkøà`¸à¢¸ào¸àføà¤øà ˆŸOÜ‚ˆ]Z[ÈÛ\ÜÓ˜[YOHœ™]\›‹\Ù][™ÜÈÝ[[X\žO¹§ly.«8àiøàk¹i%zhçøàîùn,9.«9§hy.íÜÝ[[X\žO]ˆÛ\ÜÓ˜[YOHœØÙ[˜\š[ËYÜšYX™[¹i%zhçù.¢9k¦[œ]\OH[YHˆ˜[YO^Ü™]\›”Ù][™ÜË™[›™\•[Y_HÛÚ[™ÙO^Ê]™[
HOˆÙ]™]\›”Ù][™ÜÊ
˜[YJHOˆ
È‹‹˜[YK[›™\•[YNˆ]™[\™Ù]˜[YHJJ_HÏÛX™[X™[¹b,9ç`9n#9§&úiáOÙ[XÝ˜[YO^Ü™]\›”Ù][™ÜË˜\œš]˜[Ý][ÛŸHÛÚ[™ÙO^Ê]™[
HOˆÙ]™]\›”Ù][™ÜÊ
˜[YJHOˆ
È‹‹˜[YK\œš]˜[Ý][ÛŽˆ]™[\™Ù]˜[YH\È™]\›”Ù][™ÜÖÈ˜\œš]˜[Ý][Ûˆ—HJJ_OÜ[Û¹§ly.«:iáOÛÜ[ÛÜ[Û¹dàymçziáOÛÜ[ÛÜ[Û¹¥¬9k¯úiáOÛÜ[ÛÜ[Û¹®"ú,-úiáOÛÜ[ÛÜÙ[XÝÛX™[X™[¹n,8à¢¸àkºfîú.âˆ9¢`:) y¦`ºe¤Ï[œ]\OH›[X™\ˆˆZ[^Ì_HX^^ÌÌH˜[YO^Ü™]\›”Ù][™ÜËœ™]\›•˜Z[“Z[]\ÈÏÈHÛÚ[™ÙO^Ê]™[
HOˆÙ]™]\›”Ù][™ÜÊ
˜[YJHOˆ
È‹‹˜[YK™]\›•˜Z[“Z[]\ÎˆX]›Z[ŠÌX]›X^
K[X™\Š]™[\™Ù]˜[YJHJJHJJ_HÏÛX™[X™[º/å9cm9¢`:) y¦`ºe¤ÏÙ[XÝ˜[YO^Ü™]\›”Ù][™ÜËœ™[[™]\›“Z[]\ßHÛÚ[™ÙO^Ê]™[
HOˆÙ]™]\›”Ù][™ÜÊ
˜[YJHOˆ
È‹‹˜[YK™[[™]\›“Z[]\Îˆ[X™\Š]™[\™Ù]˜[YJHJJ_OÜ[Ûˆ˜[YO^ÌŒOŒŒ9b!ÛÜ[ÛÜ[Ûˆ˜[YO^ÌÌOŒÌ9b!ÛÜ[ÛÜ[Ûˆ˜[YO^ÍO9b!ÛÜ[ÛÜÙ[XÝÛX™[X™[¹.eù£æøàîú`ayní¹/fz(åOÙ[XÝ˜[YO^Ü™]\›”Ù][™ÜË˜[œÙ™\“Z[]\È
È™]\›”Ù][™ÜË™[^PY™™\“Z[]\ßHÛÚ[™ÙO^Ê]™[
HOˆÙ]™]\›”Ù][™ÜÊ
˜[YJHOˆ
È‹‹˜[YK˜[œÙ™\“Z[]\Îˆ[X™\Š]™[\™Ù]˜[YJHH˜[YK™[^PY™™\“Z[]\ÈJJ_OÜ[Ûˆ˜[YO^Ì_OŒyb!ÛÜ[ÛÜ[Ûˆ˜[YO^ÌÍ_OŒÍyb!ÛÜ[ÛÜ[Ûˆ˜[YO^Í_Oyb!ÛÜ[ÛÜÙ[XÝÛX™[Ù]ÛX[¹l#ùå,9c§úiáxàbøà¢^Ü™]\›”Ù][™ÜË˜\œš]˜[Ý][ÛŸxàkù© ¹ë¥ÈÜ™]\›•š\˜Z[‘\Ý[X]_xà ¹k§úf¦øàk¹b%ú.â¹¦`¹b.øàîù.eú.â¹¦`ºe¤øàiøàkøà`¸à¢¸ào¸àføà¤øà ÜÛX[Ù]Z[Ï‚ˆÜÙXÝ[Û‚‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YOH˜Ø\™ÜÝËXØ\™ˆYHœÜÝË\[™[‚ˆ]ˆÛ\ÜÓ˜[YOHœÙXÝ[Û‹ZXY[™È]Ü[ˆÛ\ÜÓ˜[YOH™^YXœ›ÝÈº)¬ùabyg,ÜÜ[º(c8àcyab8à¤¹£¨¸àfOÚÙ]Ü[ˆÛ\ÜÓ˜[YOH˜ÛÝ[X˜YÙHžÝš\ÚX›TÜÝË›[™Ýy.íÜÜ[Ù]‚ˆX™[Û\ÜÓ˜[YOHœÙX\˜ÚX›ÞÙX\˜ÚÚ^™O^ÌMŸHÏ[œ]˜[YO^Ü]Y\ž_HÛÚ[™ÙO^Ê]™[
HOˆÙ]]Y\žJ]™[\™Ù]˜[YJ_HXÙZÛ\Hº)¬ùabyg,8àîù§hy.í¸à¤¹©'9í(ˆˆÏÛX™[‚ˆ]ˆÛ\ÜÓ˜[YOH™š[\‹ZXY[™È\Ýš[\ˆÚ^™O^ÌM_HÏˆ9íg¸à¢º/¯8àoÏÙ]‚ˆ]ˆÛ\ÜÓ˜[YOH™š[\‹XÚ\ÈžÜš[X\žQš[\œË›X\

š[\ŠHOˆ]ÛˆÙ^O^Ùš[\ŸHÛ\ÜÓ˜[YO^ØXÝ]™Qš[\œËš[˜ÛY\Êš[\ŠHÈ˜XÝ]™HˆˆˆŸHÛÛXÚÏ^Ê
HOˆÙÙÛQš[\Šš[\Š_OžÙš[\ˆOOHºfê9i*ykï¹oçˆÈºfê8àiøà “ÒÈˆˆš[\ˆOOH¹k¯ù¬â¹¥¯z*+xàbøà¢z/äxàaˆÈ¹k¯øàbøà¢z/äxàaˆˆš[\ŸOØ]ÛŠ_OÙ]‚ˆ]Z[ÈÛ\ÜÓ˜[YOH˜Y˜[˜ÙYYš[\œÈÝ[[X\žOº*lùí,9§hy.íÜÝ[[X\žO]ˆÛ\ÜÓ˜[YOH™š[\‹XÚ\ÈžØY˜[˜ÙYš[\œË›X\

š[\ŠHOˆ]ÛˆÙ^O^Ùš[\ŸHÛ\ÜÓ˜[YO^ØXÝ]™Qš[\œËš[˜ÛY\Êš[\ŠHÈ˜XÝ]™HˆˆˆŸHÛÛXÚÏ^Ê
HOˆÙÙÛQš[\Šš[\Š_OžÙš[\ŸOØ]ÛŠ_OÙ]Ù]Z[Ï‚ˆ]ˆÛ\ÜÓ˜[YOH™\Ý[˜ÙK\™Y™\™[˜ÙHˆ\šXK[X™[Hº)¬ùabyg,9. :)©øàkº-çzfè¹gî¹®¥ˆÜ[º-çzfè¸àk¹gî¹®¥ÜÜ[žÊÈšÝ[‹›Ù]Ø\˜H‹›\Ý‹œÙ[XÝY—H\ÈÛÛœÝ
K›X\

Ù^JHOˆ]ÛˆÙ^O^ÚÙ^_HÛ\ÜÓ˜[YO^Ù\Ý[˜ÙT™Y™\™[˜ÙHOOHÙ^HÈ˜XÝ]™HˆˆˆŸHÛÛXÚÏ^Ê
HOˆÙ]\Ý[˜ÙT™Y™\™[˜ÙJÙ^J_OžÊÈÝ[ˆ¹k¯ù¬â¹¥¯z*+H‹Ù]Ø\˜Nˆ¹l#ùå,9c§úiáH‹\Ýˆ¹¥áyê"øàk¹§ 9o£‹Ù[XÝYˆº`n9¢§¹.+HˆJVÚÙ^W_OØ]ÛŠ_OÙ]‚ˆX™[Û\ÜÓ˜[YOHœÛÜ\Ù[XÝ¹.)¸àny¦ïøàbÙ[XÝ˜[YO^ÜÜÝÛÜHÛÚ[™ÙO^Ê]™[
HOˆÙ]ÜÝÛÜ
]™[\™Ù]˜[YH\È\[ÙˆÜÝÛÜ
_OÜ[Ûˆ˜[YOH›™X\ˆ¹gî¹®¥¹g,9à®xàbøà¢z/äxàaÛÜ[ÛÜ[Ûˆ˜[YOH™š]™Hº.â¹¦`ºe¤øàc9çëxàaÛÜ[ÛÜ[Ûˆ˜[YOH˜Yº/ïyb¨9¦`ºe¤øàc9çëxàaÛÜ[ÛÜ[Ûˆ˜[YOH˜Ü›ÝÙ¹­íúfäxàc9l$xàj¸àaÛÜ[ÛÜ[Ûˆ˜[YOH˜Ú[¹kd8àjxà ¹d$xàdOÛÜ[ÛÜ[Ûˆ˜[YOHœ˜Z[ˆºfê9i*ykï¹oçÛÜ[ÛÜ[Ûˆ˜[YOHœÝ^H¹®ç¹g*9¦`ºe¤øàc9çëxàaÛÜ[ÛÜ[Ûˆ˜[YOHœšXÙH¹¥¦zaäxàc9k¢xàaÛÜ[ÛÜÙ[XÝÛX™[‚ˆ]ˆÛ\ÜÓ˜[YOHœÜÝ[\ÝžÝš\ÚX›TÜÝË›X\

ÜÝ
HOˆÈÛÛœÝÝ˜ZYÚHZ\‘\Ý[˜ÙRÛJÜÝ™Y™\™[˜ÙTÚ[
NÈÛÛœÝ\Ý[˜ÙHHÝ˜ZYÚ
ˆ
Ý˜ZYÚÈÈKHˆKJNÈÛÛœÝZ[]\ÈHX]›X^
‹X]œ›Ý[™
\Ý[˜ÙH
ˆ‹Œˆ
È
JNÈÛÛœÝYY^\ÈHË‹‹›™]ÈÙ]
][™\˜\žK™š[\Š
][JHOˆ][K\HOOHœÜÝˆ	‰ˆ][KœÜÝYOOHÜÝšY
K›X\

][JHOˆ][K™^JJWNÈÛÛœÝÜ›ÝÙHÜ›ÝÙ]Z[ÊÜÝ
NÈ™]\›ˆ]ÛˆÙ^O^ÜÜÝšYHÛ\ÜÓ˜[YO^ØÜÝ\›ÝÈ	ÜÙ[XÝYÜÝËšYOOHÜÝšYÈœÙ[XÝYˆˆˆŸXHÛÛXÚÏ^Ê
HOˆÈÙ]Ù[XÝYÜÝ
ÜÝ
NÈÙ][Øš[TÚY]Ü[ŠYJNÈ_OÜ[ˆÛ\ÜÓ˜[YO^ØÜ›ÝÙ[Z[šH	ÜÜÝ˜Ü›ÝÙ]™[XHÏÜ[ˆÛ\ÜÓ˜[YOHœÜÝ\›ÝËXÛÛ[Ý›Û™ÏžÜÜÝ›˜[Y_OÜÝ›Û™ÏÛX[Û\ÜÓ˜[YOHœÜÝY\Ý[˜ÙHžÊÈÝ[ˆ¹k¯øàbøà¢H‹Ù]Ø\˜Nˆ¹l#ùå,9c§úiáxàbøà¢H‹\Ýˆ¹¥áyê"øàk¹§ 9o£8àbøà¢H‹Ù[XÝYˆº`n9¢§¹.+xàk¹g,9à®xàbøà¢HˆJVÙ\Ý[˜ÙT™Y™\™[˜ÙW_H:.âžÛZ[]\ßyb!¸àîÞÙ\Ý[˜ÙKÑš^Y
J_ZÛOÜÛX[žÜÜÝ˜Ø]YÛÜžHOOHºhìºhçÈˆÈÛX[ºiä:.â¹h-ÜÜÝœ\šÚ[™Ð]˜Z[X›HÈ¸à`¸à¢ˆˆˆº) yè®º*£HŸH0­ÈÜÜÝœšXÙPY[ÏÈ¹¥¦zaäxàkùak9o#øàiùè®º*£HŸOÜÛX[ˆˆÛX[¹¥¯z*+HØÜ›ÝÙ^
Ü›ÝÙ™˜XÚ[]K›]™[
_H0­È:iä:.âˆØÜ›ÝÙ^
Ü›ÝÙœ\šÚ[™Ë›]™[
_H0­È:`dú-ëÈØÜ›ÝÙ^
Ü›ÝÙœ›ØY›]™[
_OÜÛX[ŸOÛX[žÜÜÝ˜Ø]YÛÜž_H0­È9®ç¹g*ÜÜÝœÝ^SZ[]\ßyb!ˆ0­È:fê9i*{ï&žÜÜÝœ˜Z[žQ^QœšY[™HÈ¸¥ãˆˆˆ¸¥¬ÈŸ^ØYY^\Ë›[™ÝÈ0­È9§"	ØYY^\Ë›X\

^JHOˆ^HOOHHÈŒLˆˆˆŒLÈŠKš›Ú[Š¸àîÈŠ_y¥éxàjú/ïyb¨9®"8àoØˆˆŸOÜÛX[ÜÜ[Ú]œ›Û‘ÝÛˆÚ^™O^ÌM_HÏØ]ÛŽÈJ_OÙ]‚ˆÜÙXÝ[Û‚‚ˆÜÝ]Z[Ù^O^ÜÙ[XÝYÜÝËšYÏÈ™[\HŸHÜÝ^ÜÙ[XÝYÜÝH][™\˜\žO^Ú][™\˜\ž_H\Ý[˜ÙQœ›ÛRÝ[^ÜÙ[XÝYÜÝÈZ\‘\Ý[˜ÙRÛJÙ[XÝYÜÝÝ[Ú[
H
ˆKHˆ[™Yš[™YH\Ý[˜ÙQœ›ÛSÙ]Ø\˜O^ÜÙ[XÝYÜÝÈZ\‘\Ý[˜ÙRÛJÙ[XÝYÜÝ˜\ÙTÜÝÖÌJH
ˆKHˆ[™Yš[™YHÛ“Ü[Y^ÜÙ]YX[ÙÔÜÝHÛÛÜÙO^Ê
HOˆÙ]Ù[XÝYÜÝ
[™Yš[™Y
_HÏ‚‚ˆ]ˆÛ\ÜÓ˜[YOHš][™\˜\žK\[™[ˆYHš][™\˜\žK\[™[][™\˜\žT[›™\ˆ][™\˜\žO^Ú][™\˜\ž_HÜÝÏ^ÜÜÝßHÙ[XÝYÜÝ^ÜÙ[XÝYÜÝHXÝ]™Q^O^ØXÝ]™Q^_H›Ý]Q^O^Ü›Ý]Q^_H›Ý]S[ÙO^Ü›Ý]S[Ù\ÖØXÝ]™Q^W_H^TÝ\[YO^ØXÝ]™Q^HOOHHÈÛÛ™][ÛœË™^LTÝ\[YHˆÛÛ™][ÛœË™^L”Ý\[Y_HØØ][Û”XÚÓ[ÙO^ÛØØ][Û”XÚÓ[Ù_HÛ”Ý\ØØ][Û”XÚÏ^Ø™YÚ[“ØØ][Û”XÚßHÛØ[˜Ù[ØØ][Û”XÚÏ^ØØ[˜Ù[ØØ][Û”XÚßHÛXÝ]™Q^PÚ[™ÙO^ÜÙ]XÝ]™Q^_HÛ”›Ý]Q^PÚ[™ÙO^ÜÙ]›Ý]Q^_HÛÚ[™ÙO^Ý\]R][™\˜\ž_HÛÛX\^ØÛX\’][™\˜\ž_HÏÙ]‚‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YO^ØØ\™Ý™\ÜËXØ\™	ÜÝ™\ÜË›X™[XO‚ˆ]ˆÛ\ÜÓ˜[YOHœÙXÝ[Û‹ZXY[™È]Ü[ˆÛ\ÜÓ˜[YOH™^YXœ›ÝÈ¹¥áyê"øàkº,¨:#mÏÜÜ[žÜÝ™\ÜË›X™[OÚÙ]Ü[ˆÛ\ÜÓ˜[YOHœÝ™\ÜË\ØÛÜ™HžÛØYØÛÜ™_HÈLÜÜ[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOHœÝ™\ÜËYØ]YÙHˆ›ÛOHœ›ÙÜ™\ÜØ˜\ˆˆ\šXK[X™[H¹¥áyê"øàkº,¨:#møà®xà¬øà¨ˆˆ\šXK]˜[Y[Z[^ÌH\šXK]˜[Y[X^^ÌLH\šXK]˜[Y[›ÝÏ^ÛØYØÛÜ™_H\šXK]˜[Y]^^Ø:,¨:#mÈ	ÛØYØÛÜ™_yà®xà yb)9k¦ˆ	ÜÝ™\ÜË›X™[XOÜ[ˆ\šXKZY[HYHˆÝ[O^ÞÈÚYˆ	ÛØYØÛÜ™_IX_HÏH\šXKZY[HYHˆÝ[O^ÞÈYˆ	ÛØYØÛÜ™_IX_HÏÙ]‚ˆ]ˆÛ\ÜÓ˜[YOHœÝ™\ÜË\ØØ[HÜ[¸à¡¸àhøàgøà¢ÜÜ[Ü[¹oæxàeøàaÜÜ[Ù]‚ˆžÙÙ]Ý™\ÜÑ\ØÜš\[ÛŠÝ™\ÜË›X™[
_OÜ‚ˆ]ˆÛ\ÜÓ˜[YOH™Z[K\Ý™\ÜÈˆ\šXK[X™[H¹¥éxàe8àj8àkº,¨:#mÈÜ[Ž9§"L¹¥éHÝ›Û™ÏžÜÝ™\ÜË™^\ÖÌWKœØÛÜ™_HÈLÜÝ›Û™ÏˆÜÝ™\ÜË™^\ÖÌWK›X™[OÜÜ[Ü[Ž9§"Lù¥éHÝ›Û™ÏžÜÝ™\ÜË™^\ÖÌ—KœØÛÜ™_HÈLÜÝ›Û™ÏˆÜÝ™\ÜË™^\ÖÌ—K›X™[OÜÜ[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOHœÝ™\ÜËXœ™XZÙÝÛˆˆ\šXK[X™[H¹¥áz(c9aj9/døàkº,¨:#mùa¡z*,ÈžÜÝ™\ÜË™^\ÖØXÝ]™Q^WK˜œ™XZÙÝÛ‹›X\

][JHOˆ]ˆÙ^O^Ú][K›X™[OÜ[žÚ][K›X™[OÛX[žÚ][K››Ý_OÜÛX[ÜÜ[Ý›Û™ÏžÚ][KœØÛÜ™_O[O‹ÞÚ][K›X^OÙ[OÜÝ›Û™ÏÙ]Š_OÙ]‚ˆ[žÜÝ™\ÜËœÝYÙÙ\Ý[ÛœË›X\

ÝYÙÙ\Ý[ÛŠHOˆHÙ^O^ÜÝYÙÙ\Ý[ÛŸOÚXÚÐÚ\˜ÛLˆÚ^™O^ÌM_HÏÜ[žÜÝYÙÙ\Ý[ÛŸ^ÜÝYÙÙ\Ý[Û‹š[˜ÛY\Ê¹/$y¡ªHŠH	‰ˆ]ÛˆÛ\ÜÓ˜[YOH^X]ÛˆˆÛÛXÚÏ^ØY™[YYœ™XZßOŒŒ9b!¸àk¹/$y¡ªxà¤º/ïyb¨Ø]ÛŸ^ÜÝYÙÙ\Ý[Û‹š[˜ÛY\Ê¹l#ùå,9c§ÈŠH	‰ˆ]ÛˆÛ\ÜÓ˜[YOH^X]ÛˆˆÛÛXÚÏ^Ê
HOˆÈÛÛœÝ\ÝHË‹‹™^L—Kœ™]™\œÙJ
K™š[™

][JHOˆ][K\HOOHœÜÝŠNÈYˆ
\Ý
H\]R][™\˜\žJ][™\˜\žK™š[\Š
][JHOˆ][KšYOOH\ÝšY
JNÈ_O¹§ 9o£8àkº)¬ùabyg,8à¤¹i%¸àfOØ]ÛŸOÜÜ[ÛOŠ_OÝ[‚ˆÜÙXÝ[Û‚‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YOHœ›Ý]K[Ý™\šY]È›Ý]K[Ý™\šY]Ë\[™[‚ˆ]ˆÛ\ÜÓ˜[YOH›Ý™\šY]ËZXY[™È¹¥éxàe8àj8àîù¥áz(c9aj9/døàk¹d":*"Ù]‚ˆÝ[[X\žP›ØÚÈ]OHŽ9§"L¹¥éHˆÝ[[X\žO^ÜÝ[[X\žL_H\Ô™XØ[Ý[][™Ï^Ü›Ý]S[Ù\ÖÌWHOOH›ØY[™ÈŸHÏ‚ˆÝ[[X\žP›ØÚÈ]OHŽ9§"Lù¥éHˆÝ[[X\žO^ÜÝ[[X\žLŸH\Ô™XØ[Ý[][™Ï^Ü›Ý]S[Ù\ÖÌ—HOOH›ØY[™ÈŸHÏ‚ˆ]ˆÛ\ÜÓ˜[YO^ØÚÛK]š\	Ú\Ô™XØ[Ý[][™ÈÈš\Ë\™XØ[Ý[][™ÈˆˆˆŸXOÜ[¹¥áz(c9aj9/dÏÜÜ[žÚ\Ô™XØ[Ý[][™ÈÈÝ›Û™Ï¹a£z*"9ë¥ù.+x )ÜÝ›Û™ÏˆˆÝ›Û™ÏžÝÝ[\Ý[˜ÙKÑš^Y
J_HÛH0­È:`bú.èˆÛZ[]\ÕÕ^
Ý[š]™J_H0­È9®ç¹g*ÛZ[]\ÕÕ^
Ý[Ý^J_OÜÝ›Û™ÏÛX[Œ¹¥éyæë¸àk¹l#ùå,9c§úiáyb,9ç`9æë¹k¢HÙ›Ü›X][™[YJÛÛ™][ÛœË™^L”Ý\[YKÝ[[X\žL‹Ý[Z[]\Ê_OÜÛX[ÏŸOÙ]‚ˆÛ\ÜÓ˜[YOHœ›Ý]K\ÛÝ\˜ÙK[›ÝH¹g,9fìùíc:-ëûï&Œy¥éyæëˆÜ›Ý]S[ÙSX™[
›Ý]S[Ù\ÖÌWJ_H;ï#È¹¥éyæëˆÜ›Ý]S[ÙSX™[
›Ý]S[Ù\ÖÌ—J_OÜ‚ˆÜÙXÝ[Û‚‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YOH˜Ø\™™]\›‹XØ\™‚ˆ]ˆÛ\ÜÓ˜[YOHœÙXÝ[Û‹ZXY[™È]Ü[ˆÛ\ÜÓ˜[YOH™^YXœ›ÝÈŽ9§"Lù¥éxàk¹n,9.«9.¢9®+ÜÜ[žÜ™]\›”Ù][™ÜË™[›™\•[Y_xàk¹i%zhçøàjúe¤øàjùd"8àa»ï'ÏÚÙ]Ü[ˆÛ\ÜÓ˜[YO^Ø™]\›‹]™\™XÝ	Ü™]\›•š\˜Ø\Ù\ÖÌK™\™XÝXOžÜ™]\›•š\˜Ø\Ù\ÖÌK™\™XÝOÜÜ[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOHœ™]\›‹XØ\Ù\ÈžÜ™]\›•š\˜Ø\Ù\Ë›X\

[žJHOˆ]ˆÙ^O^Ù[žK›X™[OÝ›Û™ÏžÙ[žK›X™[OÜÝ›Û™ÏÜ[¹l#ùå,9c§ùç`Ù[žKœÝ][Û\œš]˜[H0­È:/å9cm9k£9.¡ˆÙ[žKœ™]\›ÛÛ\]_OÜÜ[Ü[žÜ™]\›”Ù][™ÜË˜\œš]˜[Ý][ÛŸyç`Ù[žKÚÞ[Ð\œš]˜[OÜÜ[¹i%zhçøào¸àiÈÙ[žK™[›™\“X\™Ú[ˆHÈZ[]\ÕÕ^
[žK™[›™\“X\™Ú[ŠHˆ	ÛZ[]\ÕÕ^
Y[žK™[›™\“X\™Ú[Š_z-¡z`c˜OØÛX[žÙ[žK™\™XÝOÜÛX[Ù]Š_OÙ]‚ˆÛ\ÜÓ˜[YOH›]]Y[›ÝH¹.æyçìùc§ù`m8àk¹l#ùå,9c§úiáyb,9ç`9£ª9ij;ï&º`&¹n.Ü™]\›•š\œ™XÛÛ[Y[™YÝ][Û\œš]˜[Ì_xào¸àiûï#ù­íúfäHÜ™]\›•š\œ™XÛÛ[Y[™YÝ][Û\œš]˜[ÌW_xào¸àiûï#ùk¢yaj:aãz)¥ˆÜ™]\›•š\œ™XÛÛ[Y[™YÝ][Û\œš]˜[Ì—_xào¸àiÏœˆÏºfîú.â¹¦`ºe¤øàkøàê¸à¨¸àêøà¯øà©8àè9¦`¹b.ú(j8àiøàkøàj¸àcøà y.eú.â¹¦`ºe¤øàk¸àoøàk¹. :"+9æ¡8àj¹¢`:) y¦`ºe¤øàjøà¢8à¢ù© ¹ë¥øàiøàfxà ¹.eù£æù/fz(åxàîú`ayní¹å*9.¢9`¦xàkùb)z`%9b¨9ë¥øàeøài¸àa8ào¸àfxà ¹k§úf¦øàk¹b%ú.â¹¦`¹b.øà z`bù/$xà z`ayní¸àkùak9o#ù áyh,xà¤¸àe9è®º*£xàcøàh8àexàa8à Ü‚ˆÜ™]\›•š\˜Ø\Ù\ÖÌWK™[›™\“X\™Ú[ˆÌ	‰ˆ]ÛˆÛ\ÜÓ˜[YOHœÙXÛÛ™\žKX]ÛˆˆÛÛXÚÏ^Ê
HOˆÈÛÛœÝ\ÝHË‹‹™^L—Kœ™]™\œÙJ
K™š[™

][JHOˆ][K\HOOHœÜÝŠNÈYˆ
\Ý
HÈ\]R][™\˜\žJ][™\˜\žK™š[\Š
][JHOˆ][KšYOOH\ÝšY
JNÈÙ]Ø\Ý
	Û\Ý]_xà¤¹i%¸àeøà yn,9.«9/fz(åxà¤¹a£z*"9ë¥øàeøào¸àeøàgØ
NÈH_O¹§ 9o£8àkº)¬ùabyg,8à¤¹i%¸àfOØ]ÛŸBˆÜÙXÝ[Û‚‚ˆ]Z[ÈÛ\ÜÓ˜[YOH›Ü[Û˜[]ÛÛÈÝ[[X\žOÜ\šÛ\ÈÚ^™O^ÌM_HÏˆ8à­xàìøàåøàêøàåøàêxàìøà¤¹«å:/ øàeøàiº`jyå*ÜÝ[[X\žO]ˆÛ\ÜÓ˜[YOH˜]]Ë\[‹YÜšYžØ]]Ô[Ø\™ÊØ[\T[œËÜÝË™]\›”Ù][™ÜÊK›X\

È]K\ØÜš\[Û‹[‹Y]šXÜÈJHOˆ]ÛˆÛ\ÜÓ˜[YOH˜]]Ë\[‹XØ\™ˆÙ^O^Ý]_HÛÛXÚÏ^Ê
HOˆØY[Š[Š_OÝ›Û™ÏžÝ]_OÜÝ›Û™ÏÜ[žÙ\ØÜš\[ÛŸOÜÜ[ÛX[º-l:(cÛY]šXÜË™\Ý[˜ÙKÑš^Y
J_ZÛH0­È9­íúfäz  ù¡kˆÛZ[]\ÕÕ^
Y]šXÜË™š]™J_OÜÛX[ÛX[¹¥éyb)z,¨:#mÈÛY]šXÜË™^L_HÈÛY]šXÜË™^LŸH0­È9§ly.«9ç`ÛY]šXÜËÚÞ[ßOÜÛX[[O¸àdøàk¸àåøàêxàìøà¤º`jyå*Ù[OØ]ÛŠ_OÙ]Ù]Z[Ï‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YOH™]KY\ØÛZ[Y\ˆÛÝY˜Z[ˆÚ^™O^ÌMßHÏ]Ý›Û™Ï¹ áyh,xàk¹¢lxàaÜÝ›Û™Ï¹e­¹©ky¦`ºe¤øàîù¥¦zaäxàîú`dú-ëùâ­¹¬àxàkùi"ybåxàeøào¸àfxà ¸àê¸à¨¸àêøà¯øà©8àè9®"ù®ç¸àîù­íúfäxàkù§*¹£©yí¦¸àiøà y£ª9k¦¹ áyh,xàj8àeøàiº(j9é.¸àeøào¸àfxà ÜÙ]ÜÙXÝ[Û‚ˆØ\ÚYO‚‚ˆÙXÝ[ÛˆÛ\ÜÓ˜[YOH›X\XÛÛ[[ˆ‚ˆX\Ø[˜\ÈÜÝÏ^Ýš\ÚX›TÜÝßHÙ[XÝYÜÝ^ÜÙ[XÝYÜÝH›Ý]Q^O^Ü›Ý]Q^_HÛ”Ù[XÝÜÝ^ÊÜÝ
HOˆÈÙ]Ù[XÝYÜÝ
ÜÝ
NÈÙ][Øš[TÚY]Ü[ŠYJNÈ_H][™\˜\žO^Ú][™\˜\ž_HÛ”›Ý]S[Ù\ÐÚ[™ÙO^ÜÙ]›Ý]S[Ù\ßHØØ][Û”XÚÓ[ÙO^ÛØØ][Û”XÚÓ[Ù_HØØ][Û”XÚÐØ[™Y]O^ÛØØ][Û”XÚÐØ[™Y]_HÛ“ØØ][Û”XÚÐØ[™Y]O^ÜÙ]ØØ][Û”XÚÐØ[™Y]_HÛÛÛ™š\›SØØ][Û”XÚÏ^ØÛÛ™š\›SØØ][Û”XÚßHÛØ[˜Ù[ØØ][Û”XÚÏ^ØØ[˜Ù[ØØ][Û”XÚßHÏ‚ˆÜÙXÝ[Û‚ˆÙ]‚ˆ˜]ˆÛ\ÜÓ˜[YO^Ø[Øš[KX›ÝÛK[˜]ˆ	Û[Øš[TÚY]Ü[ˆÈš\Ë[Ü[ˆˆˆˆŸH	ÛØØ][Û”XÚÓ[ÙHÈš\Ë[ØØ][Û‹\XÚÚ[™ÈˆˆˆŸXH\šXK[X™[H¸àè¸àä8à©8àêùå*8àâ¸àäøà¬¸àï8à­øàéøàìÈ‚ˆ]ÛˆÛÛXÚÏ^Ê
HOˆÙ][Øš[TÚY]Ü[Š˜[ÙJ_OX\[›™YÚ^™O^ÌMŸHÏˆ9g,9fìÏØ]Û‚ˆ]ÛˆÛÛXÚÏ^Ê
HOˆÜ[“[Øš[T[™[
œÜÝË\[™[Š_OÙX\˜ÚÚ^™O^ÌMŸHÏˆ:(c8àcyabØ]Û‚ˆ]ÛˆÛÛXÚÏ^Ê
HOˆÜ[“[Øš[T[™[
š][™\˜\žK\[™[Š_OØ[[™\‘^\ÈÚ^™O^ÌMŸHÏˆ9¥áyê"ÏØ]Û‚ˆÛ˜]‚ˆÝØ\Ý	‰ˆ]ˆÛ\ÜÓ˜[YOHØ\Ýˆ›ÛOHœÝ]\Èˆ\šXK[]™OHœÛ]HÚXÚÐÚ\˜ÛLˆÚ^™O^ÌMßHÏˆÝØ\ÝOÙ]ŸBˆÜÚ\™Q\œ›Üˆ	‰ˆ]ˆÛ\ÜÓ˜[YOHØ\Ýˆ›ÛOH˜[\Ú\˜ÛP[\Ú^™O^ÌMßHÏˆÜÚ\™Q\œ›ÜŸOÙ]ŸBˆØYX[ÙÔÜÝ	‰ˆYÜÝX[ÙÈÜÝ^ØYX[ÙÔÜÝH][™\˜\žO^Ú][™\˜\ž_HÜÝÏ^ÜÜÝßH™]\›”Ù][™ÜÏ^Ü™]\›”Ù][™ÜßHÛÛÛ™š\›O^Ê™\]Y\Ý
HOˆYÜÝ
YX[ÙÔÜÝ™\]Y\Ý
_HÛ”™[[Ý™Q^\Ý[™Ï^Ê
HOˆÈÛÛœÝ™^H][™\˜\žK™š[\Š
][JHOˆJ][K\HOOHœÜÝˆ	‰ˆ][KœÜÝYOOHYX[ÙÔÜÝšY
JNÈ\]R][™\˜\žJ™^
NÈÙ]Ø\Ý
	ØYX[ÙÔÜÝ›˜[Y_xà¤¹¥áyê"øàbøà¢ybbºfi8àeøào¸àeøàgØ
NÈ_HÛ•šY]Ñ^\Ý[™Ï^Ê
HOˆÈÛÛœÝ^HH][™\˜\žK™š[™

][JHOˆ][K\HOOHœÜÝˆ	‰ˆ][KœÜÝYOOHYX[ÙÔÜÝšY
OË™^NÈYˆ
^JHÈÙ]XÝ]™Q^J^JNÈÙ]›Ý]Q^J^JNÈÚ[™ÝËœÙ][Y[Ý]


HOˆØÝ[Y[™Ù][[Y[žRY
š][™\˜\žK\[™[ŠOËœØÜ›Û[ÕšY]ÊÈ™Z]š[ÜŽˆœÛ[ÛÝ‹›ØÚÎˆœÝ\ˆJK
NÈH_HÛÛÜÙO^Ê
HOˆÙ]YX[ÙÔÜÝ
[™Yš[™Y
_HÏŸBˆÜÚ\™SÜ[ˆ	‰ˆÚ\™QX[ÙÈÝ]O^ØÝ\œ™[š\Ý]_HÛÛÜÙO^Ê
HOˆÙ]Ú\™SÜ[Š˜[ÙJ_HÛ•Ø\Ý^ÜÙ]Ø\ÝHÏŸBˆÜ[™[™ÔÚ\™H	‰ˆ]ˆÛ\ÜÓ˜[YOH™X[ÙËX˜XÚÙ›ÜÙXÝ[ÛˆÛ\ÜÓ˜[YOH˜YYX[ÙÈÚ\™Y\›Û\ˆ›ÛOH™X[ÙÈˆ\šXK[[Ù[HYHˆ\šXK[X™[YžOHœÚ\™Y\›Û\]]H]ˆÛ\ÜÓ˜[YOH™X[ÙËZXY[™È]Ü[ˆÛ\ÜÓ˜[YOH™^YXœ›ÝÈ¹aly§"xàexà£8àgù¥áyê"ÏÜÜ[ˆYHœÚ\™Y\›Û\]]H¹aly§"y¥áyê"øà¤ºe¢øàcxào¸àfxàbûï'ÏÚÙ]Ù]ŒŒ¹nm9§"L¹¥éxà'Lù¥éH0­È9.®ˆ0­È:)¬ùabyg,Ü[™[™ÔÚ\™KœÝ]Kš][™\˜\žK™š[\Š
][JHOˆ][K\HOOHœÜÝŠK›[™Ýy.íÜ¹§ly.«:iáyb,9ç`9.¢9®+8àkøà z`jyå*9o£8àjùãï¹g*8àk¹­íúfäz*+yk¦¸àiùa£z*"9ë¥øàeøào¸àfxà Ü]ˆÛ\ÜÓ˜[YOH™X[ÙËXXÝ[ÛœÈ]ÛˆÛ\ÜÓ˜[YOHœÙXÛÛ™\žKX]ÛˆˆÛÛXÚÏ^Ê
HOˆÙ][™[™ÔÚ\™J[™Yš[™Y
_O¹ãï¹g*8àk¹¥áyê"øà¤¹í«y£ OØ]Û]ÛˆÛ\ÜÓ˜[YOHœÙXÛÛ™\žKX]ÛˆˆÛÛXÚÏ^Ê
HOˆ\TÚ\™Yš\
˜[ÙJ_O¹. 9¦`¹æ¡8àjú)¢øà¢ÏØ]Û]ÛˆÛ\ÜÓ˜[YOHœš[X\žKX]ÛˆˆÛÛXÚÏ^Ê
HOˆ\TÚ\™Yš\
YJ_Oº!ê¹b!¸àk¹¥áyê"øàj8àeøài¹/çykfØ]ÛÙ]ÜÙXÝ[ÛÙ]ŸBˆÛXZ[‚ˆ
NÂŸB‚™[˜Ý[Ûˆ›Ý]S[ÙSX™[
[ÙNˆ›Ý]S[ÙJHÂˆ™]\›ˆÙ]›Ý]T™\Ù[][ÛŠ[ÙJK›X™[ÂŸB‚™[˜Ý[ÛˆÝ[[X\žP›ØÚÊÈ]KÝ[[X\žK\Ô™XØ[Ý[][™ÈNˆÈ]NˆÝš[™ÎÈÝ[[X\žNˆ™]\›•\O\[ÙˆØ[Õš\Ý[[X\žO–È™^LH—NÈ\Ô™XØ[Ý[][™Îˆ›ÛÛX[ˆJHÂˆYˆ
\Ô™XØ[Ý[][™ÊH™]\›ˆ]ˆÛ\ÜÓ˜[YOHœÝ[[X\žKX›ØÚÈ\Ë\™XØ[Ý[][™Èˆ\šXK[]™OHœÛ]HÝ›Û™ÏžÝ]_OÜÝ›Û™ÏÜ[º-çzfè¸àîù¦`ºe¤øà¤¹a£z*"9ë¥ù.+x )ÜÜ[Ù]ŽÂˆ™]\›ˆ]ˆÛ\ÜÓ˜[YOHœÝ[[X\žKX›ØÚÈÝ›Û™ÏžÝ]_OÜÝ›Û™ÏÜ[º-l:(cÜÝ[[X\žK™\Ý[˜ÙRÛKÑš^Y
J_HÛOÜÜ[Ü[º`&¹n.ÛZ[]\ÕÕ^
Ý[[X\žK˜˜\ÙQš]™SZ[]\Ê_OÜÜ[Ü[¹­íúfäz  ù¡kˆÛZ[]\ÕÕ^
Ý[[X\žKœ™YXÝYš]™SZ[]\Ê_OÜÜ[Ü[¹®ç¹g*ÛZ[]\ÕÕ^
Ý[[X\žKœÝ^SZ[]\Ê_OÜÜ[žÜÝ[[X\žKØZ]Z[]\Èˆ	‰ˆÜ[¹n#9§&ù¦`¹b.ùo¡xàhHÛZ[]\ÕÕ^
Ý[[X\žKØZ]Z[]\Ê_OÜÜ[ŸOÙ]ŽÂŸB‚™[˜Ý[Ûˆ]]Ô[Ø\™Ê[œÎˆØ[\T[–×KÜÝÎˆÜÝ×K™]\›”Ù][™ÜÎˆ™]\›”Ù][™ÜÊHÂˆÛÛœÝžRYHØš™XÝ™œ›ÛQ[šY\Ê[œË›X\

[ŠHOˆÜ[‹šY[—JJNÂˆ™]\›ˆÂˆÈ]Nˆ¹§ 8à ¹©oxàj¸àåøàêxàìÈ‹\ØÜš\[ÛŽˆ¹.æyçìùc§ùa¡xàiùk£9íd8à ¹éîùbåxàj9b)9¥«yfç¹¥l8à¤¹§ 9l#ùc%¸à ˆ‹[ŽˆžRYœÙ[™ÛÚÝZ\˜HKˆÈ]Nˆ¹ï£º(dúi*9.+yoàÈ‹\ØÜš\[ÛŽˆ¹lbùa¡y.+yoàøàiù¦¤xàexàîúfê8àjùkï¹oç8à ˆ‹[ŽˆžRYÈœ˜Z[‹[]\Ù][H—HKˆÈ]Nˆ¹ë¬y¨.xà¢xàeøàezaãz)¥ˆ‹\ØÜš\[ÛŽˆ¹¥êy§'xàk¹i)ù­£:,-øà¤¹d*øà 8à y§hy.í¹.æ8àcxàk¹¨b8à ˆ‹[ŽˆžRY›ÝØZÝY[šHKˆÈ]Nˆ¹­íúfäyfçº`oÈ‹\ØÜš\[ÛŽˆ¹a`ùë¬y¨.y.+yoàøà¤º`oøàdxà y®e¹l.ù`m8àn8à ˆ‹[ŽˆžRY›ZÙHKˆK›X\

][JHOˆÂˆÛÛœÝ^LHH][Kœ[‹š][™\˜\žK™š[\Š
[žJHOˆ[žK™^HOOHJNÂˆÛÛœÝ^LˆH][Kœ[‹š][™\˜\žK™š[\Š
[žJHOˆ[žK™^HOOHŠNÂˆÛÛœÝÝ[[X\žHHØ[Õš\Ý[[X\žJ^LK^L‹ÜÝÊNÂˆÛÛœÝÝ™\ÜÈH\ÜÙ\ÜÔÝ™\ÜÊ^LK^L‹ÜÝÊNÂˆÛÛœÝ™]\›•š\HØ[Ý[]T™]\›•š\
^L‹ÜÝË™]\›”Ù][™ÜÊNÂˆ™]\›ˆÈ‹‹š][KY]šXÜÎˆÈ\Ý[˜ÙNˆÝ[[X\žK™\Ý[˜ÙRÛKš]™NˆÝ[[X\žKœ™YXÝYš]™SZ[]\Ë^LNˆÝ™\ÜË™^\ÖÌWKœØÛÜ™K^LŽˆÝ™\ÜË™^\ÖÌ—KœØÛÜ™KÚÞ[Îˆ™]\›•š\˜Ø\Ù\ÖÌKÚÞ[Ð\œš]˜[HNÂˆJNÂŸB