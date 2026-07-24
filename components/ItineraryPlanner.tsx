"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, BedDouble, Coffee, GripVertical, MapPin, Plus, RotateCcw, Trash2 } from "lucide-react";
import { calcDaySummary, estimateLeg, formatEndTime, minutesToText } from "@/lib/trip";
import { ItineraryItem, ItemType, Spot } from "@/types";

type Props = {
  itinerary: ItineraryItem[];
  spots: Spot[];
  activeDay: 1 | 2;
  onActiveDayChange: (day: 1 | 2) => void;
  onChange: (items: ItineraryItem[]) => void;
  onClear: () => void;
};

const itemIcon: Record<ItemType, string> = { start: "出", goal: "着", spot: "観", meal: "食", hotel: "泊", break: "休" };

export default function ItineraryPlanner({ itinerary, spots, activeDay, onActiveDayChange, onChange, onClear }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeItems = itinerary.filter((item) => item.day === activeDay).sort((a, b) => a.order - b.order);
  const summary = calcDaySummary(activeItems, spots);
  const startTime = activeDay === 1 ? "11:15" : "09:00";

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
    const untouched = itinerary.filter((entry) => entry.day !== item.day && entry.day !== targetDay);
    onChange([
      ...untouched,
      ...sourceItems.map((entry, index) => ({ ...entry, order: index + 1 })),
      ...targetItems.map((entry, index) => ({ ...entry, order: index + 1 })),
      { ...item, day: targetDay, order: targetItems.length + 1 },
    ]);
  };

  return (
    <section className="planner-card">
      <div className="section-heading"><div><span className="eyebrow">訪問順</span><h2>旅程を組み立てる</h2></div><button className="text-button danger" onClick={onClear}><Trash2 size={14} /> すべて削除</button></div>
      <div className="day-tabs" role="tablist">
        {([1, 2] as const).map((day) => <button key={day} className={day === activeDay ? "active" : ""} onClick={() => onActiveDayChange(day)} role="tab">{day}日目 <small>{itinerary.filter((item) => item.day === day).length}件</small></button>)}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="itinerary-list">
            {activeItems.map((item, index) => <SortableItem key={item.id} item={item} index={index} totalItems={activeItems.length} startTime={startTime} previousItems={activeItems.slice(0, index)} onMove={move} onRemove={remove} onMoveDay={moveDay} />)}
          </ol>
        </SortableContext>
      </DndContext>
      {!activeItems.length && <p className="empty-inline">観光地一覧から追加してください。</p>}
      <div className="quick-add">
        <button onClick={() => addSpecial("meal")}><Plus size={14} /> 食事</button>
        <button onClick={() => addSpecial("break")}><Coffee size={14} /> 休憩</button>
        <button onClick={() => addSpecial("hotel")}><BedDouble size={14} /> 宿泊</button>
      </div>
      <div className="day-summary">
        <div><small>移動距離</small><strong>{summary.distanceKm.toFixed(1)} km</strong></div>
        <div><small>通常時の運転</small><strong>{minutesToText(summary.baseDriveMinutes)}</strong></div>
        <div><small>混雑考慮</small><strong>{minutesToText(summary.predictedDriveMinutes)}</strong></div>
        <div><small>終了予定</small><strong>{formatEndTime(startTime, summary.totalMinutes)}</strong></div>
      </div>
      <p className="route-explanation">青・紫の線は訪問順です。道路に沿った経路を取得できない場合は破線の簡易ルートに切り替わります。</p>
    </section>
  );
}

function SortableItem({ item, index, totalItems, startTime, previousItems, onMove, onRemove, onMoveDay }: {
  item: ItineraryItem; index: number; totalItems: number; startTime: string; previousItems: ItineraryItem[]; onMove: (index: number, direction: -1 | 1) => void; onRemove: (id: string) => void; onMoveDay: (id: string, target: 1 | 2) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const elapsed = previousItems.reduce((sum, entry, previousIndex) => {
    const next = previousItems[previousIndex + 1] ?? item;
    return sum + entry.stayMinutes + estimateLeg(entry, next).predictedMinutes;
  }, 0);
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={`itinerary-item ${isDragging ? "dragging" : ""}`}>
      <button className="drag-handle" aria-label={`${item.title}を並べ替える`} {...attributes} {...listeners}><GripVertical size={16} /></button>
      <span className="item-order">{index + 1}</span>
      <span className={`item-type ${item.type}`}>{itemIcon[item.type]}</span>
      <div className="item-content"><strong>{item.title}</strong><small>{formatEndTime(startTime, elapsed)}〜 · {item.stayMinutes}分</small></div>
      <div className="item-buttons">
        <button aria-label="上へ" disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={14} /></button>
        <button aria-label="下へ" disabled={index === totalItems - 1} onClick={() => onMove(index, 1)}><ArrowDown size={14} /></button>
        {item.type === "spot" && <button className="day-move" onClick={() => onMoveDay(item.id, item.day === 1 ? 2 : 1)}>{item.day === 1 ? "2日目へ" : "1日目へ"}</button>}
        {!(["start", "goal"] as ItemType[]).includes(item.type) && <button aria-label="削除" className="remove" onClick={() => onRemove(item.id)}><Trash2 size={14} /></button>}
      </div>
    </li>
  );
}
