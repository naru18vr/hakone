"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { AddCustomRequest } from "@/lib/itinerary";
import { ItineraryItem } from "@/types";

type Kind = AddCustomRequest["type"];
const defaults: Record<Kind, { label: string; title: string; minutes: number }> = {
  meal: { label: "食事", title: "昼食", minutes: 60 },
  break: { label: "休憩", title: "休憩", minutes: 20 },
  free: { label: "自由予定", title: "自由予定", minutes: 30 },
};
type Props = { day: 1 | 2; itinerary: ItineraryItem[]; onAdd: (request: AddCustomRequest) => void; onClose: () => void };

export default function AddCustomItemDialog({ day: initialDay, itinerary, onAdd, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [kind, setKind] = useState<Kind>("meal");
  const [title, setTitle] = useState(defaults.meal.title);
  const [day, setDay] = useState<1 | 2>(initialDay);
  const [minutes, setMinutes] = useState(60);
  const [placement, setPlacement] = useState<AddCustomRequest["placement"]>("end");
  const [targetId, setTargetId] = useState("");
  const [time, setTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [note, setNote] = useState("");
  const [reserved, setReserved] = useState(false);
  const [error, setError] = useState("");
  const items = itinerary.filter((item) => item.day === day).sort((a, b) => a.order - b.order);
  const selectKind = (next: Kind) => { setKind(next); setTitle(defaults[next].title); setMinutes(defaults[next].minutes); };
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const submit = () => {
    if (!title.trim()) return setError("タイトルを入力してください");
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 600) return setError("滞在時間は0分以上、600分以下で入力してください");
    onAdd({ type: kind, title, day, stayMinutes: minutes, placement, targetId: targetId || undefined, requestedArrivalTime: time || undefined, locationName, note, isReserved: reserved });
  };
  const targetNeeded = placement === "before" || placement === "after";
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="add-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-title"><div className="dialog-heading"><div><span className="eyebrow">予定を追加</span><h2 id="custom-title">食事・休憩などを追加</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="予定追加を閉じる"><X size={20} /></button></div><div className="dialog-choice"><p>種類</p>{(Object.keys(defaults) as Kind[]).map((entry) => <button key={entry} className={kind === entry ? "active" : ""} onClick={() => selectKind(entry)}>{defaults[entry].label}</button>)}</div><div className="custom-fields"><label className="field-label">タイトル（必須）<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="scenario-grid"><label>日付<select value={day} onChange={(event) => { setDay(Number(event.target.value) as 1 | 2); setTargetId(""); }}><option value={1}>8月12日</option><option value={2}>8月13日</option></select></label><label>滞在時間（分）<input type="number" min="0" max="600" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label></div><label className="field-label">追加位置<select value={placement} onChange={(event) => { setPlacement(event.target.value as AddCustomRequest["placement"]); setTargetId(""); }}><option value="start">その日の最初</option><option value="end">その日の最後</option><option value="before">指定した予定の前</option><option value="after">指定した予定の後</option><option value="time">希望時刻に近い位置</option></select></label>{targetNeeded && <label className="field-label">基準予定<select value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">選択してください</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}{placement === "time" && <label className="field-label">到着希望時刻<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>}<label className="field-label">場所名（任意）<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="地図地点なし・ルート対象外" /></label><label className="field-label">メモ（任意）<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><label className="share-note"><input type="checkbox" checked={reserved} onChange={(event) => setReserved(event.target.checked)} /> 予約済み</label></div>{error && <p className="field-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" disabled={targetNeeded && !targetId} onClick={submit}><CalendarPlus size={16} /> 予定を追加</button></div></section></div>;
}
