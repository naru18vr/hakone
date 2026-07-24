"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { ArrowDown, ArrowUp, CarFront, GripVertical, Plus, Trash2 } from "lucide-react";
import AddCustomItemDialog from "@/components/AddCustomItemDialog";
import { addCustomItemToItinerary, moveItineraryItemToDay, normalizeItinerary } from "@/lib/itinerary";
import { getRoutePresentation } from "@/lib/routing";
import { buildDaySchedule, calcDaySummary, estimateLeg, formatEndTime, minutesToText } from "@/lib/trip";
import { CustomLocation, ItineraryItem, ItemType, RouteMode, Spot } from "@/types";

type RouteDay = 1 | 2 | "all";
type Props = {
  itinerary: ItineraryItem[];
  spots: Spot[];
  selectedSpot?: Spot;
  activeDay: 1 | 2;
  routeDay: RouteDay;
  routeMode: RouteMode;
  locationPickMode: boolean;
  onStartLocationPick: (commit: (location: CustomLocation) => void) => void;
  onCancelLocationPick: () => void;
  onActiveDayChange: (day: 1 | 2) => void;
  onRouteDayChange: (day: RouteDay) => void;
  onChange: (items: ItineraryItem[]) => void;
  onClear: () => void;
};

const itemIcon: Record<ItemType, string> = { start: "出", goal: "着", spot: "観", meal: "食", hotel: "泊", break: "休", rental_car: "車", transport: "交", free: "予", travel_note: "記" };
const itemLabel: Record<ItemType, string> = { start: "出発", goal: "到着", spot: "観光地", meal: "食事", hotel: "宿泊", break: "休憩", rental_car: "レンタカー", transport: "交通", free: "自由予定", travel_note: "移動メモ" };
const dateLabel = (day: 1 | 2) => day === 1 ? "8月12日" : "8月13日";

export default function ItineraryPlanner({ itinerary, spots, selectedSpot, activeDay, routeDay, routeMode, locationPickMode, onStartLocationPick, onCancelLocationPick, onActiveDayChange, onRouteDayChange, onChange, onClear }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const activeItems = itinerary.filter((item) => item.day === activeDay).sort((a, b) => a.order - b.order);
  const startTime = activeDay === 1 ? "11:15" : "09:00";
  const summary = calcDaySummary(activeItems, spots, startTime);
  const entries = buildDaySchedule(activeItems, spots, startTime).entries;
  const routePresentation = getRoutePresentation(routeMode);

  const replaceDay = (nextDayItems: ItineraryItem[]) => {
    const other = itinerary.filter((item) => item.day !== activeDay);
    onChange(normalizeItinerary([...other, ...nextDayItems]));
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = activeItems.findIndex((item) => item.id === active.id);
    const newIndex = activeItems.findIndex((item) => item.id === over.id);
    replaceDay(arrayMove(activeItems, oldIndex, newIndex));
  };
  const move = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= activeItems.length) return;
    replaceDay(arrayMove(activeItems, index, index + direction));
  };
  const remove = (id: string) => replaceDay(activeItems.filter((item) => item.id !== id));
  const moveDay = (id: string, targetDay: 1 | 2) => {
    onChange(moveItineraryItemToDay(itinerary, id, targetDay));
  };
  const selectRouteDay = (day: RouteDay) => {
    onRouteDayChange(day);
    if (day !== "all") onActiveDayChange(day);
  };
  const handleRouteTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, current: RouteDay) => {
    const options: RouteDay[] = [1, 2, "all"];
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
    event.preventDefault();
    const currentIndex = options.indexOf(current);
    const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    const target = options[targetIndex];
    selectRouteDay(target);
    window.requestAnimationFrame(() => document.getElementById(`route-tab-${target}`)?.focus());
  };

  return (
    <section className="planner-card">
      <div className="section-heading"><div><span className="eyebrow">地図と同期</span><h2>旅程を組み立てる</h2></div><button className="text-button danger" onClick={onClear}><Trash2 size={14} /> すべて削除</button></div>
      <div className="route-day-tabs" role="tablist" aria-label="地図に表示する日程">
        <button id="route-tab-1" role="tab" aria-selected={routeDay === 1} aria-controls="map-route-panel" tabIndex={routeDay === 1 ? 0 : -1} className={routeDay === 1 ? "active day-one" : "day-one"} onKeyDown={(event) => handleRouteTabKeyDown(event, 1)} onClick={() => selectRouteDay(1)}><span className="route-tab-swatch" aria-hidden="true" />8/12 1日目</button>
        <button id="route-tab-2" role="tab" aria-selected={routeDay === 2} aria-controls="map-route-panel" tabIndex={routeDay === 2 ? 0 : -1} className={routeDay === 2 ? "active day-two" : "day-two"} onKeyDown={(event) => handleRouteTabKeyDown(event, 2)} onClick={() => selectRouteDay(2)}><span className="route-tab-swatch" aria-hidden="true" />8/13 2日目</button>
        <button id="route-tab-all" role="tab" aria-selected={routeDay === "all"} aria-controls="map-route-panel" tabIndex={routeDay === "all" ? 0 : -1} className={routeDay === "all" ? "active all-days" : "all-days"} onKeyDown={(event) => handleRouteTabKeyDown(event, "all")} onClick={() => selectRouteDay("all")}><span className="route-tab-swatch" aria-hidden="true" />全体</button>
      </div>
      <div className="planner-day-heading"><span className={`route-dot day-${activeDay}`} /> {dateLabel(activeDay)}の旅程 <small>ドラッグで順番変更</small></div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="itinerary-list detailed-itinerary">
            {entries.map(({ item, arrivalOffset, leg: incomingLeg }, index) => <li key={item.id} className="itinerary-group">
              {incomingLeg && <TravelLeg leg={incomingLeg} departure={formatEndTime(startTime, entries[index - 1].arrivalOffset + entries[index - 1].item.stayMinutes)} arrival={formatEndTime(startTime, arrivalOffset)} routeMode={routeMode} />}
              <SortableItem item={item} index={index} totalItems={activeItems.length} startTime={startTime} arrivalOffset={arrivalOffset} onMove={move} onRemove={remove} onMoveDay={moveDay} />
            </li>)}
          </ol>
        </SortableContext>
      </DndContext>
      {!activeItems.length && <p className="empty-inline">観光地一覧から追加してください。</p>}
      <div className="quick-add"><button onClick={() => setCustomDialogOpen(true)}><Plus size={14} /> 予定を追加</button></div>
      <div className={`day-summary labelled-summary ${routeMode === "loading" ? "is-recalculating" : ""}`} aria-live="polite">
        {routeMode === "loading" ? <div className="summary-calculating"><small>{dateLabel(activeDay)}の合計</small><strong>再計算中…</strong></div> : <><div><small>{dateLabel(activeDay)}の走行距離</small><strong>{summary.distanceKm.toFixed(1)} km</strong></div><div><small>通常時の運転</small><strong>{minutesToText(summary.baseDriveMinutes)}</strong></div><div><small>混雑考慮の運転</small><strong>{minutesToText(summary.predictedDriveMinutes)}</strong></div><div><small>終了予定</small><strong>{formatEndTime(startTime, summary.totalMinutes)}</strong></div></>}
      </div>
      <p className={`route-explanation ${routeMode}`}><strong>{routePresentation.label}</strong>：{routePresentation.detail} 並べ替え・移動・削除のたびに、地図、時刻、距離、負荷を更新します。</p>
      {customDialogOpen && <AddCustomItemDialog day={activeDay} itinerary={itinerary} spots={spots} selectedSpot={selectedSpot} isLocationPicking={locationPickMode} onStartMapPick={onStartLocationPick} onAdd={(request) => { const result = addCustomItemToItinerary(itinerary, request); if (result.added) { onChange(result.itinerary); setCustomDialogOpen(false); } }} onClose={() => { onCancelLocationPick(); setCustomDialogOpen(false); }} />}
    </section>
  );
}

function TravelLeg({ leg, departure, arrival, routeMode }: { leg: ReturnType<typeof estimateLeg>; departure: string; arrival: string; routeMode: RouteMode }) {
  const road = leg.predictedMinutes >= leg.baseMinutes * 1.2 ? "混雑" : leg.predictedMinutes > leg.baseMinutes ? "やや混雑" : "比較的スムーズ";
  if (routeMode === "loading") return <div className="travel-leg loading" aria-live="polite"><CarFront size={14} /><div><strong><b>仮</b> 経路を計算中…</strong><span>{departure} 出発 → {arrival} 到着予定。時刻と距離は仮表示です。</span></div></div>;
  if (routeMode === "fallback") return <div className={`travel-leg ${road} fallback`} title="直線距離に山道係数を掛けた仮計算です"><CarFront size={14} /><div><strong>{departure} 出発 → {arrival} 到着予定 <b>仮</b></strong><span>簡易推計 {leg.predictedMinutes}分 · 約 {leg.distanceKm.toFixed(1)}km</span><em>道路経路は取得できませんでした。直線距離を基にした仮計算です。</em></div><small>道路：{road}</small></div>;
  return <div className={`travel-leg ${road} routing`}><CarFront size={14} /><div><strong>{departure} 出発 → {arrival} 到着</strong><span>車 {leg.baseMinutes}分 · {leg.distanceKm.toFixed(1)}km · 混雑考慮 {leg.predictedMinutes}分</span><em>道路経路取得済み</em></div><small>道路：{road}</small></div>;
}

function SortableItem({ item, index, totalItems, startTime, arrivalOffset, onMove, onRemove, onMoveDay }: {
  item: ItineraryItem; index: number; totalItems: number; startTime: string; arrivalOffset: number; onMove: (index: number, direction: -1 | 1) => void; onRemove: (id: string) => void; onMoveDay: (id: string, target: 1 | 2) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return <div ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? "dragging" : ""}`}>
    <button className="drag-handle" aria-label={`${item.title}を並べ替える`} {...attributes} {...listeners}><GripVertical size={16} /></button>
    <span className="item-order">{index + 1}</span>
    <span className={`item-type ${item.type}`}>{itemIcon[item.type]}</span>
    <div className="item-content"><strong>{item.title}{item.isReserved && <em>予約済み</em>}</strong><small>{formatEndTime(startTime, arrivalOffset)} 到着 · {itemLabel[item.type]} · 滞在 {item.stayMinutes}分 · {formatEndTime(startTime, arrivalOffset + item.stayMinutes)} 出発</small>{item.latitude === undefined && !(["start", "goal"] as ItemType[]).includes(item.type) && <small>地図地点なし・ルート対象外</small>}</div>
    <div className="item-buttons">
      <button aria-label="上へ" disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={14} /></button>
      <button aria-label="下へ" disabled={index === totalItems - 1} onClick={() => onMove(index, 1)}><ArrowDown size={14} /></button>
      {!( ["start", "goal"] as ItemType[]).includes(item.type) && <button className="day-move" aria-label={`${item.title}を${item.day === 1 ? "8月13日" : "8月12日"}へ移動`} onClick={() => onMoveDay(item.id, item.day === 1 ? 2 : 1)}>{item.day === 1 ? "8月13日へ移動" : "8月12日へ移動"}</button>}
      {!( ["start", "goal"] as ItemType[]).includes(item.type) && <button aria-label="削除" className="remove" onClick={() => onRemove(item.id)}><Trash2 size={14} /></button>}
    </div>
  </div>;
}
