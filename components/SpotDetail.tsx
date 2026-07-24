"use client";

import { Car, Check, Clock3, CloudRain, ExternalLink, Footprints, MapPin, Plus, Users, X } from "lucide-react";
import { CrowdSource, ItineraryItem, Spot } from "@/types";
import { crowdDetails, crowdText } from "@/lib/crowd";

const sourceLabel: Record<CrowdSource, string> = {
  realtime: "リアルタイム情報",
  forecast: "予測情報",
  general: "一般的な傾向",
  manual: "手動設定",
};

const crowdLabel = ["", "比較的空いている", "やや混雑", "混雑", "非常に混雑"];
type Props = {
  spot?: Spot;
  itinerary: ItineraryItem[];
  distanceFromHotel?: number;
  distanceFromOdawara?: number;
  onOpenAdd: (spot: Spot) => void;
  onClose: () => void;
};

export default function SpotDetail({ spot, itinerary, distanceFromHotel, distanceFromOdawara, onOpenAdd, onClose }: Props) {

  if (!spot) return (
    <section className="detail-empty">
      <MapPin size={28} />
      <p>地図上のマーカー、または観光地一覧を選ぶと、営業時間・歩く量・混雑の目安を確認できます。</p>
    </section>
  );

  const addedDays = [...new Set(itinerary.filter((item) => item.type === "spot" && item.spotId === spot.id).map((item) => item.day))];
  const crowds = crowdDetails(spot);
  const arrival = itinerary.find((item) => item.type === "spot" && item.spotId === spot.id)?.startTime;

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
      <details className="crowd-details"><summary>混雑の内訳・時間帯別予測（{sourceLabel[spot.crowdSource]}）</summary><div className="crowd-split"><span>施設内 <b>{crowdText(crowds.facility.level)}</b></span><span>駐車場 <b>{crowdText(crowds.parking.level)}</b></span><span>周辺道路 <b>{crowdText(crowds.road.level)}</b></span></div><small>根拠：{crowds.road.reasons.join("・")}／信頼度：{crowds.road.confidence === "medium" ? "中" : "低"}。リアルタイム情報ではありません。</small><div className="crowd-hours">{crowds.hourly.map((entry, index) => <span key={index} className={`level-${entry.level}`}><b>{index + 9}時</b>{crowdText(entry.level)}</span>)}</div>{arrival && <p>旅程の到着希望：{arrival}（現在の旅程では混雑を再確認してください）</p>}<p>おすすめ訪問時間：{spot.bestTime}</p></details>
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
      <div className="detail-actions">
        <button className="primary-button" onClick={() => onOpenAdd(spot)}>{addedDays.length ? <Check size={17} /> : <Plus size={17} />}{addedDays.length ? ` 8月${addedDays.map((day) => day === 1 ? "12" : "13").join("・")}日に追加済み` : " 旅程へ追加"}</button>
        {spot.officialUrl && <a className="secondary-button" href={spot.officialUrl} target="_blank" rel="noreferrer">公式サイト <ExternalLink size={15} /></a>}
      </div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="fact"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
