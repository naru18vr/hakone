"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Send, X } from "lucide-react";
import { createShareUrl, shareUrlLengthLevel } from "@/lib/share";
import { TripState } from "@/types";

type Props = { state: TripState; onClose: () => void; onToast: (message: string) => void };

export default function ShareDialog({ state, onClose, onToast }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [url, setUrl] = useState("");
  const create = () => setUrl(createShareUrl(window.location.origin, window.location.pathname, state, includeNotes));
  const level = useMemo(() => shareUrlLengthLevel(url.length), [url]);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); onToast("共有URLをコピーしました"); }
    catch { onToast("URLをコピーできませんでした。手動で選択してコピーしてください。"); }
  };
  const nativeShare = async () => {
    if (!url) create();
    const shareUrl = url || createShareUrl(window.location.origin, window.location.pathname, state, includeNotes);
    if (navigator.share) { await navigator.share({ title: "箱根ゆる旅プランナー", text: "箱根旅行の旅程を共有します", url: shareUrl }); return; }
    await navigator.clipboard.writeText(shareUrl); onToast("端末共有に未対応のため、URLをコピーしました");
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="add-dialog share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title"><div className="dialog-heading"><div><span className="eyebrow">旅程を共有</span><h2 id="share-title">共有URL</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="共有画面を閉じる"><X size={20} /></button></div><p>共有URLには施設ID・旅程・旅行条件を含めます。氏名、予約番号、現在地は含めません。</p><label className="share-note"><input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} /> 予定のメモを含める（初期値：含めない）</label><div className="dialog-actions"><button className="secondary-button" onClick={create}>共有URLを作成</button><button className="primary-button" onClick={nativeShare}><Send size={16} /> 端末の共有機能を使う</button></div>{url && <><label className="field-label">共有URL<textarea value={url} readOnly onFocus={(event) => event.currentTarget.select()} /></label><button className="primary-button copy-button" onClick={copy}><Copy size={16} /> URLをコピー</button>{level !== "normal" && <p className={`share-length ${level}`}>共有URLが{level === "warning" ? "5,000文字以上" : "2,000文字以上"}です。一部のアプリでは正しく共有できない可能性があります。</p>}<p className="share-ready"><Check size={15} /> 別のブラウザで開くと、旅程を適用する前に確認画面を表示します。</p></>}</section></div>;
}
