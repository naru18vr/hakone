"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, BedDouble, CarFront, Coffee, GripVertical, Plus, Trash2 } from "lucide-react";
import { calcDaySummary, estimateLeg, formatEndTime, minutesToText } from "@/lib/trip";
import { ItineraryItem, ItemType, RouteMode, Spot } from "@/types";

type RouteDay = 1 | 2 | "all";
type Props = {
  itinerary: ItineraryItem[];
  spots: Spot[];
  activeDay: 1 | 2;
  routeDay: RouteDay;
  routeMode: RouteMode;
  onActiveDayChange: (day: 1 | 2) => void;
  onRouteDayChange: (day: RouteDay) => void;
  onChange: (items: ItineraryItem[]) => void;
  onClear: () => void;
};

const itemIcon: Record<ItemType, string> = { start: "出", goal: "着", spot: "観", meal: "食", hotel: "泊", break: "休" };
const dateLabel = (day: 1 | 2) => day === 1 ? "8月12日" : "8月13日";

export default function ItineraryPlanner({ itinerary, spots, activeDay, routeDay, routeMode, onActiveDayChange, onRouteDayChange, onChange, onClear }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeItems = itinerary.filter((item) => item.day === activeDay).sort((a, b) => a.order - b.order);
  const summary = calcDaySummary(activeItems, spots);
  const startTime = activeDay === 1 ? "11:15" : "09:00";
  const entries = activeItems.map((item, index) => {
    const arrivalOffset = activeItems.slice(0, index).reduce((total, previous, previousIndex) => {
      const next = activeItems[previousIndex + 1] ?? item;
      return total + previous.stayMinutes + getLeg(previous, next, spots).predictedMinutes;
    }, 0);
    return { item, arrivalOffset, incomingLeg: index > 0 ? getLeg(activeItems[index - 1], item, spots) : undefined };
  });

  const replaceDay = (nextDayItems: ItineraryItem[]) => {
    const other = itinerary.filter((item) => item.day !== activeDay);
    onChange([...other, ...nextDayItems.map((item, index) => ({ ...item, order: index + 1 }))]);
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
  const addSpecial = (type: "meal" | "break" | "hotel") => {
    const labels = { meal: "昼食・食事", break: "休憩", hotel: "宿泊施設" };
    const lastPoint = activeItems.at(-1);
    replaceDay([...activeItems, {
      id: `${type}-${activeDay}-${Date.now()}`, day: activeDay, type, title: labels[type], stayMinutes: type === "meal" ? 60 : type === "break" ? 20 : 30,
      order: activeItems.length + 1, latitude: lastPoint?.latitude, longitude: lastPoint?.longitude,
    }]);
  };
  const moveDay = (id: string, targetDay: 1 | 2) => {
    const item = itinerary.find((entry) => entry.id === id);
    if (!item || item.day === targetDay) return;
    const sourceItems = itinerary.filter((entry) => entry.day === item.day && entry.id !== id).sort((a, b) => a.order - b.order);
    const targetItems = itinerary.filter((entry) => entry.day === targetDay).sort((a, b) => a.order - b.order);
    const targetEnding = targetItems.findIndex((entry) => entry.type === "goal" || (targetDay === 1 && entry.type === "hotel"));
    const nextTargetItems = [...targetItems];
    nextTargetItems.splice(targetEnding < 0 ? nextTargetItems.length : targetEnding, 0, { ...item, day: targetDay });
    onChange([
      ...sourceItems.map((entry, index) => ({ ...entry, order: index + 1 })),
      ...nextTargetItems.map((entry, index) => ({ ...entry, order: index + 1 }),)
    ]);
  };

  return (
    <section className="planner-card">
      <div className="section-heading"><div><span className="eyebrow">地図と同期</span><h2>旅程を組み立てる</h2></div><button className="text-button danger" onClick={onClear}><Trash2 size={14} /> すべて削除</button></div>
      <div className="route-day-tabs" role="tablist" aria-label="地図に表示する日程">
        <button className={routeDay === 1 ? "active" : ""} onClick={() => { onRouteDayChange(1); onActiveDayChange(1); }}>8/12 1日目</button>
        <button className={routeDay === 2 ? "active" : ""} onClick={() => { onRouteDayChange(2); onActiveDayChange(2); }}>8/13 2日目</button>
        <button className={routeDay === "all" ? "active" : ""} onClick={() => onRouteDayChange("all")}>全体</button>
      </div>
      <div className="planner-day-heading"><span className={`route-dot day-${activeDay}`} /> {dateLabel(activeDay)}の旅程 <small>ドラッグで順番変更</small></div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="itinerary-list detailed-itinerary">
            {entries.map(({ item, arrivalOffset, incomingLeg }, index) => <li key={item.id} className="itinerary-group">
              {incomingLeg && <TravelLeg leg={incomingLeg} departure={formatEndTime(startTime, entries[index - 1].arrivalOffset + entries[index - 1].item.stayMinutes)} arrival={formatEndTime(startTime, arrivalOffset)} routeMode={routeMode} />}
              <SortableItem item={item} index={index} totalItems={activeItems.length} startTime={startTime} arrivalOffset={arrivalOffset} onMove={move} onRemove={remove} onMoveDay={moveDay} />
            </li>)}
          </ol>
        </SortableContext>
      </DndContext>
      {!activeItems.length && <p className="empty-inline">観光地一覧から追加してください。</p>}
      <div className="quick-add">
        <button onClick={() => addSpecial("meal")}><Plus size={14} /> 食事</button>
        <button onClick={() => addSpecial("break")}><Coffee size={14} /> 休憩</button>
        <button onClick={() => addSpecial("hotel")}><BedDouble size={14} /> 宿泊</button>
      </div>
      <div className="day-summary labelled-summary">
        <div><small>{dateLabel(activeDay)}の走行距離</small><strong>{summary.distanceKm.toFixed(1)} km</strong></div>
        <div><small>通常時の運転</small><strong>{minutesToText(summary.baseDriveMinutes)}</strong></div>
        <div><small>混雑考慮の運転</small><strong>{minutesToText(summary.predictedDriveMinutes)}</strong></div>
        <div><small>終了予定</small><strong>{formatEndTime(startTime, summary.totalMinutes)}</strong></div>
      </div>
      <p className={`route-explanation ${routeMode}`}>
        {routeMode === "routing"
          ? "道路経路をもとに地図を更新しています。並べ替え・移動・削除のたびに、時刻、距離、負荷を再計算します。"
          : routeMode === "loading"
            ? "道路経路を取得中です。表示中の時刻と距離は安全側の簡易推計です。"
            : "道路経路を取得できないため、地図は直線の簡易線、時刻と距離は安全側の簡易推計です。"}
      </p>
    </section>
  );
}

function getLeg(from: ItineraryItem, to: ItineraryItem, spots: Spot[]) {
  const crowd = spots.find((spot) => spot.id === to.spotId)?.crowdLevel ?? 1;
  return estimateLeg(from, to, 1 + Math.max(0, crowd - 1) * 0.08);
}

function TravelLeg({ leg, departure, arrival, routeMode }: { leg: ReturnType<typeof estimateLeg>; departure: string; arrival: string; routeMode: RouteMode }) {
  const road = leg.predictedMinutes >= leg.baseMinutes * 1.2 ? "混雑" : leg.predictedMinutes > leg.baseMinutes ? "やや混雑" : "比較的スムーズ";
  const estimateLabel = routeMode === "routing" ? "混雑予測込み" : "簡易推計";
  return <div className={`travel-leg ${road} ${routeMode}`}><CarFront size={14} /><div><strong>{departure} 出発 → {arrival} 到着</strong><span>車 通常 {leg.baseMinutes}分 · {estimateLabel} {leg.predictedMinutes}分 · {leg.distanceKm.toFixed(1)}km</span>{routeMode !== "routing" && <em>{routeMode === "loading" ? "道路経路を取得中" : "道路経路未取得：直線距離を基にした推計"}</em>}</div><small>道路：{road}</small></div>;
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
    <div className="item-content"><strong>{item.title}</strong><small>{formatEndTime(startTime, arrivalOffset)} 到着 · 滞在 {item.stayMinutes}分</small></div>
    <div className="item-buttons">
      <button aria-label="上へ" disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={14} /></button>
      <button aria-label="下へ" disabled={index === totalItems - 1} onClick={() => onMove(index, 1)}><ArrowDown size={14} /></button>
      {item.type === "spot" && <button className="day-move" onClick={() => onMoveDay(item.id, item.day === 1 ? 2 : 1)}>{item.day === 1 ? "2日目へ" : "1日目へ"}</button>}
      {!( ["start", "goal"] as ItemType[]).includes(item.type) && <button aria-label="削除" className="remove" onClick={() => onRemove(item.id)}><Trash2 size={14} /></button>}
    </div>
  </div>;
}
