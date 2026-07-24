# 箱根ゆる旅プランナー

2026年8月12日〜13日に、小田原駅からレンタカーで箱根を巡る4人家族向けの旅行計画Webアプリです。距離感、混雑の目安、歩く量、訪問順、所要時間を一画面で確認し、無理のない旅程を作ることを目的にしています。

## 実装済み（フェーズ1中心）

- OpenStreetMap + Leaflet の拡大・縮小・移動できる地図
- 小田原・箱根の15地点のマーカーと混雑色分け
- 観光地の詳細パネル（公式サイト、営業時間、料金、駐車場、雨天対応、歩く量、対象年齢、距離など）
- 「予測」と「一般的な傾向」を明確に分けた混雑表示
- 1日目・2日目の旅程追加、削除、上下移動、ドラッグ＆ドロップ並べ替え、日付間移動
- 食事・休憩・宿泊の挿入
- OSRM互換ルーティングによる道路に沿った経路表示。接続不可時は破線の簡易ルートへ自動フォールバック
- 区間を基にした距離・通常時運転時間・混雑考慮時間・滞在時間・終了予定時刻
- 「ゆったり / 標準 / やや忙しい / 詰め込みすぎ」のストレス判定と改善案
- 指定されたA〜Dのサンプル旅程と、7種類の方針からたたき台を選ぶ自動プランUI
- PCの左右レイアウトと、地図を上部に残すモバイルレイアウト

### 2026-07-24 改善フェーズ1

- PCでは左パネルのみをスクロールし、右側の大きな地図を常時表示
- モバイルでは地図を保ったまま開閉できるボトムシート
- `8/12 1日目`、`8/13 2日目`、`全体` で地図のルートと番号を切り替え
- 旅程の各地点間に、出発・到着時刻、通常時／混雑考慮時の車移動時間、距離、道路混雑の目安を表示
- 旅程追加時に、日付・指定地点の前後・到着希望時刻を選択。重複追加を防止し、操作結果をトースト表示
- 並べ替え、上下移動、別日への移動、削除に合わせて地図・時刻・距離・負荷を即時再計算
- 負荷判定を100点満点のゲージで表示

## ローカル起動

必要環境: Node.js 20.9 以上、npm 10 以上。

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

品質確認:

```bash
npm run typecheck
npm run build
```

## 環境変数・API設定

コピー元は `.env.example` です。

| 変数 | 必須 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_ROUTING_API_URL` | 任意 | ブラウザからアクセス可能なOSRM互換の経路API URL。未指定時は公開OSRMデモサーバーを試行します。 |
| `GOOGLE_MAPS_API_KEY` | 将来用 | Google Maps / Directions を接続する場合のサーバー側キー。現状は未使用。 |
| `MAPBOX_ACCESS_TOKEN` | 将来用 | Mapboxを接続する場合のキー。現状は未使用。 |
| `OPENROUTESERVICE_API_KEY` | 将来用 | OpenRouteServiceを接続する場合のキー。現状は未使用。 |

GitHub PagesではサーバーAPIを実行できないため、経路APIにはブラウザから直接アクセスします。機密情報を `NEXT_PUBLIC_*` に置かないでください。接続に失敗しても、地点を結ぶ破線ルートと安全側の簡易見積もりでアプリを利用できます。

## デプロイ（GitHub Pages）

`main` へのプッシュで `.github/workflows/deploy-pages.yml` が実行され、Next.jsの静的出力フォルダ `out` をGitHub Pagesへ公開します。

1. GitHubリポジトリの **Settings → Pages** を開く。
2. **Build and deployment** の **Source** を **GitHub Actions** に設定する。
3. `main` へプッシュする。Actionsの **Deploy to GitHub Pages** が成功すると公開される。
4. 公開URLは `https://naru18vr.github.io/hakone/`。

GitHub PagesはサーバーAPIを実行できない静的ホスティングです。そのため経路はブラウザからOSRM互換APIへ直接問い合わせ、接続できない場合は破線の簡易ルートに切り替わります。公開OSRMは試作用です。本番では、利用規約・レート制限・可用性を満たすAPIを設定してください。

## データ構造

`types/index.ts` に主要な型があります。

```ts
type Spot = {
  id: string;
  name: string;
  category: SpotCategory;
  latitude: number;
  longitude: number;
  description: string;
  officialUrl?: string;
  openingHours?: string;
  closedDays?: string;
  priceAdult?: string;
  stayMinutes: number;
  parkingAvailable: boolean;
  parkingSpaces?: string;
  rainyDayFriendly: boolean;
  walkingLevel: 1 | 2 | 3 | 4 | 5;
  childFriendly: 1 | 2 | 3 | 4 | 5;
  juniorHighFriendly: 1 | 2 | 3 | 4 | 5;
  crowdLevel: 1 | 2 | 3 | 4;
  crowdSource: "realtime" | "forecast" | "general" | "manual";
  crowdUpdatedAt: string;
};

type ItineraryItem = {
  id: string;
  day: 1 | 2;
  type: "spot" | "meal" | "hotel" | "break" | "start" | "goal";
  spotId?: string;
  title: string;
  stayMinutes: number;
  order: number;
  latitude?: number;
  longitude?: number;
};
```

観光地の初期データは `data/spots.ts`、サンプルプランは `data/plans.ts`、簡易時間・負荷判定は `lib/trip.ts` に分離しています。

## 使用API・外部サービス

| 用途 | サービス | 利用状況 |
| --- | --- | --- |
| 地図タイル | [OpenStreetMap](https://www.openstreetmap.org/) | 実装済み。地図上の表示・帰属を使用。 |
| 地図UI | [Leaflet](https://leafletjs.com/) / React Leaflet | 実装済み。 |
| 道路経路 | [OSRM](https://project-osrm.org/) 互換API | 実装済み（任意設定）。公開デモは開発確認用。 |
| 公式施設情報 | 各施設の公式サイト | リンクをデータに保持。運用では公式API/許可済み更新フローを用意。 |

## 情報の正確性と現時点の制限

- 営業時間、休館日、料金、駐車台数は変更され得るため、アプリでは静的参考データとして扱い、最終確認先として公式URLを明示しています。出発前に必ず公式サイトを確認してください。
- 混雑表示は、8月12〜13日（お盆期）、時刻、天気、場所の一般的な傾向を組み合わせた**予測**か、静的な**一般的傾向**です。リアルタイム渋滞・駐車場満空・人流は表示していません。
- ルートが道路に沿うのはOSRM互換APIに接続できたときだけです。フォールバックは直線を結ぶ参考線で、距離・時間は安全側の推定値です。
- 施設写真はライセンスを確認済みの素材をまだ同梱していないため、詳細パネルは識別用プレースホルダーを表示します。公式提供画像または利用許諾済みCDNへ置き換える前提です。
- 宿泊施設の名称は編集できますが、初期版では座標を「箱根ガラスの森美術館付近」に固定しています。施設検索、住所ジオコーディング、地図ピン指定は未実装です。
- データはブラウザ内の状態で、保存・共有URL・印刷/PDF出力・会員登録は未実装です。

## 次の改善案（フェーズ2〜3）

1. Supabase/PostgreSQLへ旅程とスポット情報を保存し、共有URLとPDF出力を追加する。
2. 許可済みの公式データ/API更新フローを作り、営業時間・休館日・料金の最終確認日時と履歴を管理する。
3. Google Maps Platform / Mapbox / 商用ルーティングAPIの費用・規約を比較し、契約済みサービスへ切り替える。
4. リアルタイムの渋滞、駐車場、火山規制、気象警報を取得できる場合は、ソース・更新時刻・信頼度を常に表示する。
5. 宿泊先の検索/住所/ピン設定、昼食候補、予約時間、雨天代替自動提案を実装する。
6. 子どもの年齢・歩行許容度・出発時刻を入力に取り、ルート最適化と複数の確率的な代替案を作成する。
