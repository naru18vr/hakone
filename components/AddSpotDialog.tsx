"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock3, MapPin, X } from "lucide-react";
import { AddPlacement, AddSpotRequest } from "@/lib/itinerary";
import { RecommendedPlacement, recommendSpotPlacement } from "@/lib/recommendation";
import { minutesToText } from "@/lib/trip";
import { ItineraryItem, Spot } from "@/types";

type Props = {
  spot: Spot;
  itinerary: ItineraryItem[];
  spots: Spot[];
  onConfirm: (request: AddSpotRequest) => void;
  onClose: () => void;
};

type Step = 1 | 2 | 3;
const labels: Record<AddPlacement | "recommended", string> = { recommended: "おすすめ位置", end: "その日の最後", before: "地点の前", after: "地点の後", time: "希望時刻を指定" };

export default function AddSpotDialog({ spot, itinerary, spots, onConfirm, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [day, setDay] = useState<1 | 2>(2);
  const [placement, setPlacement] = useState<AddPlacement | "recommended">("recommended");
  const [targetId, setTargetId] = useState("");
  const [preferredTime, setPreferredTime] = useState("13:30");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const existingDays = [...new Set(itinerary.filter((item) => item.type === "spot" && item.spotId === spot.id).map((item) => item.day))];
  const dayItems = itinerary.filter((item) => item.day === day).sort((a, b) => a.order - b.order);
  const recommendation = useMemo<RecommendedPlacement>(() => recommendSpotPlacement(itinerary, spot, day, spots), [itinerary, spot, day, spots]);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const selectDay = (next: 1 | 2) => { setDay(next); setStep(2); setTargetId(""); };
  const choosePlacement = (next: AddPlacement | "recommended") => {
    setPlacement(next);
    setStep(next === "before" || next === "after" ? 3 : 2);
  };
  const confirm = () => {
    const request = placement === "recommended" ? recommendation.request : { day, placement, targetId: targetId || undefined, preferredTime, allowDuplicate };
    onConfirm({ ...request, allowDuplicate: allowDuplicate || request.allowDuplicate });
  };
  const needTarget = placement === "before" || placement === "after";

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-dialog-title">
      <div className="dialog-heading"><div><span className="eyebrow">旅程へ追加</span><h2 id="add-dialog-title">{spot.name}</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="追加画面を閉じる"><X size={20} /></button></div>
      <div className="dialog-steps" aria-label={`ステップ${step} / 3`}><span className={step >= 1 ? "active" : ""}>1 日付</span><span className={step >= 2 ? "active" : ""}>2 追加方法</span><span className={step >= 3 ? "active" : ""}>3 基準地点</span></div>
      {step === 1 && <div className="dialog-choice"><p>どの日に追加しますか？</p><button onClick={() => selectDay(1)}>8月12日</button><button onClick={() => selectDay(2)}>8月13日</button></div>}
      {step >= 2 && <>
        <div className="dialog-selected-day"><MapPin size={15} /> 追加する日：<strong>8月{day === 1 ? "12" : "13"}日</strong><button onClick={() => setStep(1)}>変更</button></div>
        <div className="dialog-choice"><p>どこへ追加しますか？</p>{(["recommended", "end", "before", "after", "time"] as const).map((item) => <button key={item} className={placement === item ? "active" : ""} onClick={() => choosePlacement(item)}>{labels[item]}</button>)}</div>
        {placement === "recommended" && <div className="recommendation-preview"><strong><Check size={16} /> おすすめ位置</strong><p>8月{recommendation.request.day === 1 ? "12" : "13"}日・{recommendation.afterTitle}の後</p><span>走行距離 +{recommendation.distanceDeltaKm.toFixed(1)}km · 運転 +{minutesToText(recommendation.driveDeltaMinutes)} · 終了 +{minutesToText(recommendation.endDeltaMinutes)}</span><span>負荷 {recommendation.beforeScore} → {recommendation.afterScore}</span></div>}
        {placement === "time" && <label className="field-label">希望到着時刻<input type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} /></label>}
        {needTarget && step === 3 && <div className="dialog-choice target-choice"><p>{placement === "before" ? "どの地点の前に追加しますか？" : "どの地点の後に追加しますか？"}</p>{dayItems.map((item) => <button key={item.id} className={targetId === item.id ? "active" : ""} onClick={() => setTargetId(item.id)}>{item.title}</button>)}</div>}
        {existingDays.length > 0 && <div className="existing-spot"><strong>すでに 8月{existingDays.map((entry) => entry === 1 ? "12" : "13").join("・")}日に追加済みです</strong><label><input type="checkbox" checked={allowDuplicate} onChange={(event) => setAllowDuplicate(event.target.checked)} /> 別の日にも明示的に追加する</label></div>}
        <div className="dialog-actions"><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" disabled={needTarget && !targetId} onClick={confirm}><Clock3 size={16} /> この位置に追加</button></div>
      </>}
    </section>
  </div>;
}
