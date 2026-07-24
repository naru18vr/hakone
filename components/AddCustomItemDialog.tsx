"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { AddCustomRequest } from "@/lib/itinerary";
import { ItineraryItem } from "@/types";

type Kind = AddCustomRequest["type"];
const defaults: Record<Kind, { label: string; title: string; minutes: number; description: string }> = {
  meal: { label: "食事", title: "昼食", minutes: 60, description: "昼食・カフェなどの滞在予定" },
  break: { label: "休憩", title: "休憩", minutes: 20, description: "運転や歩行の合間の休憩" },
  hotel: { label: "宿泊", title: "宿泊施設", minutes: 0, description: "この日の終了地点として扱います" },
  rental_car: { label: "レンタカー", title: "レンタカー受取", minutes: 30, description: "受取・返却・給油などの手続き" },
  transport: { label: "電車・交通", title: "小田原駅で乗車", minutes: 20, description: "乗車・乗換・徒歩などの移動予定" },
  free: { label: "自由予定", title: "自由予定", minutes: 30, description: "買い物など自由に使う予定" },
  travel_note: { label: "移動メモ", title: "移動", minutes: 0, description: "時刻とルートへ影響しないメモ" },
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
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [reserved, setReserved] = useState(false);
  const [rentalAction, setRentalAction] = useState<NonNullable<AddCustomRequest["subtype"]>>("pickup");
  const [transportMode, setTransportMode] = useState<NonNullable<AddCustomRequest["transportMode"]>>("train");
  const [transportAction, setTransportAction] = useState<NonNullable<AddCustomRequest["transportAction"]>>("board");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [error, setError] = useState("");
  const items = itinerary.filter((item) => item.day === day).sort((a, b) => a.order - b.order);
  const selectKind = (next: Kind) => { setKind(next); setTitle(defaults[next].title); setMinutes(defaults[next].minutes); setError(""); };
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const submit = () => {
    if (!title.trim()) return setError("タイトルを入力してください");
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 600) return setError("滞在時間は0分以上、600分以下で入力してください");
    if ((kind === "meal" || kind === "break") && minutes === 0) return setError("食事・休憩は1分以上の滞在時間を入力してください");
    onAdd({ type: kind, title, day, stayMinutes: minutes, placement, targetId: targetId || undefined, requestedArrivalTime: time || undefined, locationName, address, note, isReserved: reserved, subtype: kind === "rental_car" ? rentalAction : undefined, transportMode: kind === "transport" ? transportMode : undefined, transportAction: kind === "transport" ? transportAction : undefined, departureTime: departureTime || undefined, arrivalTime: arrivalTime || undefined, destinationName: destinationName || undefined });
  };
  const targetNeeded = placement === "before" || placement === "after";
  const isRental = kind === "rental_car";
  const isTransport = kind === "transport";
  const isHotel = kind === "hotel";
  const isNote = kind === "travel_note";
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="add-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-title"><div className="dialog-heading"><div><span className="eyebrow">予定を追加</span><h2 id="custom-title">旅行の予定を追加</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="予定追加を閉じる"><X size={20} /></button></div><div className="dialog-choice"><p>種類</p>{(Object.keys(defaults) as Kind[]).map((entry) => <button key={entry} className={kind === entry ? "active" : ""} onClick={() => selectKind(entry)}>{defaults[entry].label}</button>)}</div><p className="custom-kind-help">{defaults[kind].description}</p><div className="custom-fields"><label className="field-label">タイトル（必須）<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="scenario-grid"><label>日付<select value={day} onChange={(event) => { setDay(Number(event.target.value) as 1 | 2); setTargetId(""); }}><option value={1}>8月12日</option><option value={2}>8月13日</option></select></label><label>滞在時間（分）<input type="number" min="0" max="600" disabled={isHotel} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />{isHotel && <small>宿泊は日程の終了として扱います</small>}</label></div>{isRental && <label className="field-label">手続き<select value={rentalAction} onChange={(event) => setRentalAction(event.target.value as typeof rentalAction)}><option value="pickup">受取</option><option value="return">返却</option><option value="procedure">手続き</option><option value="refuel">給油</option><option value="other">その他</option></select></label>}{isTransport && <><div className="scenario-grid"><label>移動手段<select value={transportMode} onChange={(event) => setTransportMode(event.target.value as typeof transportMode)}><option value="train">電車</option><option value="bus">バス</option><option value="walk">徒歩</option><option value="taxi">タクシー</option><option value="other">その他</option></select></label><label>内容<select value={transportAction} onChange={(event) => setTransportAction(event.target.value as typeof transportAction)}><option value="board">乗車</option><option value="exit">降車</option><option value="transfer">乗換</option><option value="move">移動</option></select></label></div><div className="scenario-grid"><label>出発予定<input type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} /></label><label>到着予定<input type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} /></label></div><label className="field-label">行き先（任意）<input value={destinationName} onChange={(event) => setDestinationName(event.target.value)} placeholder="例：東京駅" /></label></>}{!isNote && <label className="field-label">追加位置<select value={placement} onChange={(event) => { setPlacement(event.target.value as AddCustomRequest["placement"]); setTargetId(""); }}><option value="start">その日の最初</option><option value="end">その日の最後</option><option value="before">指定した予定の前</option><option value="after">指定した予定の後</option><option value="time">希望時刻に近い位置</option></select></label>}{targetNeeded && !isNote && <label className="field-label">基準予定<select value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">選択してください</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}{placement === "time" && !isNote && <label className="field-label">到着希望時刻<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>}<label className="field-label">場所名（任意）<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="地図地点なし・ルート対象外" /></label><label className="field-label">住所（任意）<input value={address} onChange={(event) => setAddress(event.target.value)} /></label><label className="field-label">メモ（任意）<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><label className="share-note"><input type="checkbox" checked={reserved} onChange={(event) => setReserved(event.target.checked)} /> 予約済み</label></div>{error && <p className="field-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" disabled={targetNeeded && !targetId} onClick={submit}><CalendarPlus size={16} /> 予定を追加</button></div></section></div>;
}
