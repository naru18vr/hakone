"use client";

import { useEffect, useState } from "react";
import { Car, Check, Clock3, CloudRain, ExternalLink, Footprints, MapPin, Plus, Users, X } from "lucide-react";
import { CrowdSource, ItineraryItem, Spot } from "@/types";

const sourceLabel: Record<CrowdSource, string> = {
  realtime: "リアルタイム情報",
  forecast: "予測情報",
  general: "一般的な傾向",
  manual: "手動設定",
};

const crowdLabel = ["", "比較的空いている", "やや混雑", "混雑", "非常に混雑"];
export type AddRequest = { day: 1 | 2; placement: "end" | "before" | "after"; targetId?: string; preferredTime?: string };

type Props = {
  spot?: Spot;
  itinerary: ItineraryItem[];
  distanceFromHotel?: number;
  distanceFromOdawara?: number;
  onAdd: (spot: Spot, request: AddRequest) => void;
  onClose: () => void;
};

export default function SpotDetail({ spot, itinerary, distanceFromHotel, distanceFromOdawara, onAdd, onClose }: Props) {
  const [destination, setDestination] = useState("1:end");
  const [preferredTime, setPreferredTime] = useState("");

  useEffect(() => {
    setDestination("1:end");
    setPreferredTime("");
  }, [spot?.id]);

  if (!spot) return (
    <section className="detail-empty">
      <MapPin size={28} />
      <p>地図上のマーカー、または観光地一覧を選ぶと、営業時間・歩く量・混雑の目安を確認できます。</p>
    </section>
  );

  const added = itinerary.find((item) => item.type === "spot" && item.spotId === spot.id);
  const addOptions = itinerary.filter((item) => item.type !== "start" && item.type !== "goal").sort((a, b) => a.day - b.day || a.order - b.order);
  const [dayText, placement, targetId] = destination.split(":");
  const targetDay = Number(dayText) as 1 | 2;

  return (
    <section className="detail-card" aria-live="polite">
      <div className={`detail-visual category-art ${spot.category}`} aria-label={`${spot.category}のイラスト`}>
        <span>{spot.category === "美術館" ? "✦" : spot.category === "自然" ? "♧" : spot.category === "湖" ? "≈" : spot.category === "神社" ? "⛩" : spot.category === "駅" ? "⌘" : "◉"}</span>
        <strong>{spot.name.slice(0, 1)}</strong>
      </div>
      <div className="detail-heading">
        <div><span className="eyebrow">{spot.category}</span><h2>{spot.name}</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="詳細を閉じる"><X size={18} /></button>
      </div>
      <p className="detail-description">{spot.description}</p>
      <div className={`crowd-callout crowd-l${spot.crowdLevel}`}>
        <span>混雑度：{crowdLabel[spot.crowdLevel]}</span>
        <small>{sourceLabel[spot.crowdSource]} · 更新 {spot.crowdUpdatedAt}</small>
      </div>
      <p className="muted-note">{spot.crowdHint}／おすすめ：{spot.bestTime}</p>
      <div className="fact-grid">
        <Fact icon={<Clock3 size={15} />} label="営業時間" value={spot.openingHours ?? "要確認"} />
        <Fact icon={<Clock3 size={15} />} label="定休日" value={spot.closedDays ?? "要確認"} />
        <Fact icon={<Users size={15} />} label="料金（大人）" value={spot.priceAdult ?? "要確認"} />
        <Fact icon={<Clock3 size={15} />} label="滞在目安" value={`${spot.stayMinutes}分`} />
        <Fact icon={<Car size={15} />} label="駐車場" value={spot.parkingAvailable ? spot.parkingSpaces ?? "あり" : "なし"} />
        <Fact icon={<CloudRain size={15} />} label="雨天対応" value={spot.rainyDayFriendly ? "比較的しやすい" : "屋外中心"} />
        <Fact icon={<Footprints size={15} />} label="歩く量" value={`${"●".repeat(spot.walkingLevel)}${"○".repeat(5 - spot.walkingLevel)}`} />
        <Fact icon={<Users size={15} />} label="子ども向け" value={`小学生 ${spot.childFriendly}/5・中学生 ${spot.juniorHighFriendly}/5`} />
      </div>
      <div className="distance-grid">
        <span>宿泊予定地から <strong>{distanceFromHotel?.toFixed(1) ?? "-"} km</strong></span>
        <span>小田原駅から <strong>{distanceFromOdawara?.toFixed(1) ?? "-"} km</strong></span>
      </div>
      <p className="data-note">情報区分：静的な参考データ／登録日 2026-07-24<br />{spot.dataNote}</p>
      <div className="add-destination">
        <label>旅程への追加先
          <select value={destination} onChange={(event) => setDestination(event.target.value)} disabled={Boolean(added)}>
            <option value="1:end">8月12日の最後に追加</option>
            <option value="2:end">8月13日の最後に追加</option>
            {addOptions.flatMap((item) => [
              <option key={`before-${item.id}`} value={`${item.day}:before:${item.id}`}>8月{item.day === 1 ? "12" : "13"}日・{item.title}の前に追加</option>,
              <option key={`after-${item.id}`} value={`${item.day}:after:${item.id}`}>8月{item.day === 1 ? "12" : "13"}日・{item.title}の後に追加</option>,
            ])}
          </select>
        </label>
        <label>到着希望（任意）<input type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} disabled={Boolean(added)} /></label>
      </div>
      <div className="detail-actions">
        {added ? <button className="primary-button added" disabled><Check size={17} /> {added.day === 1 ? "8月12日" : "8月13日"}に追加済み</button> : <button className="primary-button" onClick={() => onAdd(spot, { day: targetDay, placement: placement as AddRequest["placement"], targetId, preferredTime: preferredTime || undefined })}><Plus size={17} /> この場所に追加</button>}
        {spot.officialUrl && <a className="secondary-button" href={spot.officialUrl} target="_blank" rel="noreferrer">公式サイト <ExternalLink size={15} /></a>}
      </div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="fact"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
