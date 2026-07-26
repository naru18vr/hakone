import { Spot } from "@/types";

/**
 * 初期表示用の静的データです。営業時間・料金は変更されるため、表示時にも
 * 公式サイトを開けるようにしています。最終見直し: 2026-07-27。
 */
export const spots: Spot[] = [
  {
    id: "odawara-station", name: "小田原駅", category: "駅", latitude: 35.2569, longitude: 139.1557,
    description: "旅の出発・返却地点。駅周辺で早めの昼食と買い出しを済ませてから箱根へ向かうと、山道での時間ロスを抑えられます。",
    officialUrl: "https://www.jreast.co.jp/estation/station/info.aspx?StationCd=385", openingHours: "駅施設により異なる", closedDays: "なし", stayMinutes: 45,
    parkingAvailable: true, parkingSpaces: "周辺有料駐車場", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 3, juniorHighFriendly: 3,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "10〜12時・16〜18時は駅前道路が混みやすい", bestTime: "11時前に出発準備を完了", tags: ["飲食店あり", "トイレあり"], dataNote: "駅・周辺施設の営業時間は各公式案内で確認してください。", photoKind: "placeholder"
  },
  {
    id: "glass-forest", name: "箱根ガラスの森美術館", category: "美術館", latitude: 35.2640, longitude: 138.9999,
    description: "ヴェネチアン・グラスの展示と庭園を楽しめる美術館。今回の宿泊エリアに近く、到着日の午後に入れやすい場所です。",
    officialUrl: "https://www.hakone-garasunomori.jp/", openingHours: "10:00〜17:30（入館は閉館30分前まで）", closedDays: "公式サイトで要確認", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 100,
    parkingAvailable: true, parkingSpaces: "普通車約150台（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "11〜14時は入館・レストランが混みやすい", bestTime: "14時以降", tags: ["子ども向け", "雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "営業日・料金は来館前に公式サイトで必ず確認してください。", photoKind: "placeholder"
  },
  {
    id: "lalique", name: "箱根ラリック美術館", category: "美術館", latitude: 35.2615, longitude: 139.0006,
    description: "ルネ・ラリックの作品を展示する美術館。仙石原内の移動で組み合わせやすく、雨の日の候補にもなります。",
    officialUrl: "https://www.lalique-museum.com/", openingHours: "9:00〜16:00", closedDays: "第3木曜（8月は無休の場合あり・要確認）", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 75,
    parkingAvailable: true, parkingSpaces: "あり（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "昼前後はカフェ利用が集中しやすい", bestTime: "開館直後または14時以降", tags: ["雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "営業日・料金は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "wetland-garden", name: "箱根湿生花園", category: "自然", latitude: 35.2718, longitude: 138.9917,
    description: "湿地植物を中心に観察できる自然園。暑い時間帯を避け、午前の散策に向いています。",
    officialUrl: "https://hakone-shisseikaen.com/", openingHours: "9:00〜17:00（季節により変動）", closedDays: "冬季休園あり・要確認", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "あり（台数は公式案内を確認）", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "連休・午前中に団体客が入りやすい", bestTime: "開園直後", tags: ["子ども向け", "駐車場あり", "トイレあり", "宿から近い"], dataNote: "開園期間・入園料・足元の状況は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "susuki", name: "仙石原すすき草原", category: "自然", latitude: 35.2860, longitude: 138.9942,
    description: "秋のすすきで知られる開放的な草原。8月は景観が異なるため、短い散策・眺望ポイントとして扱うのが無難です。",
    officialUrl: "https://www.hakonenavi.jp/spot/1299", openingHours: "常時開放", closedDays: "なし", priceAdult: "無料", priceJuniorHigh: "無料", priceElementary: "無料", stayMinutes: 35,
    parkingAvailable: true, parkingSpaces: "近隣駐車場を要確認", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 3, juniorHighFriendly: 3,
    crowdLevel: 1, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "秋季・晴天日の午後は増えやすい", bestTime: "朝または16時前", tags: ["絶景", "無料", "駐車場あり", "トイレあり", "宿から近い"], dataNote: "天候・季節により散策の快適さが大きく変わります。", photoKind: "placeholder"
  },
  {
    id: "pola", name: "ポーラ美術館", category: "美術館", latitude: 35.2622, longitude: 139.0053,
    description: "森の中にある近現代美術館。屋内中心で暑さや雨の影響を抑えやすく、家族でペースを整えやすい候補です。",
    officialUrl: "https://www.polamuseum.or.jp/", openingHours: "9:00〜17:00（入館は16:30まで）", closedDays: "展覧会・臨時休館は要確認", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 110,
    parkingAvailable: true, parkingSpaces: "普通車163台（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 5,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "11〜14時・企画展の会期末は混みやすい", bestTime: "9時台または14時半以降", tags: ["雨天対応", "駐車場あり", "飲食店あり", "トイレあり", "宿から近い"], dataNote: "展覧会・料金・開館日は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "visitor-center", name: "箱根ビジターセンター", category: "自然", latitude: 35.2757, longitude: 138.9973,
    description: "箱根の自然・火山・ハイキング情報を確認できる拠点。短時間の立ち寄りや天候判断の出発点に便利です。",
    officialUrl: "https://hakonevc.sunnyday.jp/", openingHours: "9:00〜16:30（季節により要確認）", closedDays: "年末年始等・要確認", priceAdult: "無料", priceJuniorHigh: "無料", priceElementary: "無料", stayMinutes: 35,
    parkingAvailable: true, parkingSpaces: "あり（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 1, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "連休の午前中は情報収集の来館が増える", bestTime: "9〜10時", tags: ["子ども向け", "雨天対応", "無料", "駐車場あり", "トイレあり", "宿から近い"], dataNote: "開館時間は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "owakudani", name: "大涌谷", category: "絶景", latitude: 35.2437, longitude: 139.0211,
    description: "噴気地帯の迫力がある箱根らしい場所。夏休み・お盆は道路、駐車場、ロープウェイともに混雑しやすいため、早朝判断が重要です。",
    officialUrl: "https://www.hakonenavi.jp/spot/167", openingHours: "施設・火山状況により変動", closedDays: "火山・悪天候時は変更あり", priceAdult: "散策自体は無料（交通・施設は別）", stayMinutes: 80,
    parkingAvailable: true, parkingSpaces: "あり（混雑時は待機の可能性）", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "10〜14時、夏休み・お盆は特に混雑", bestTime: "9時台までに到着", tags: ["絶景", "子ども向け", "駐車場あり", "トイレあり"], dataNote: "火山ガス・通行規制・営業時間は当日の公式情報で確認してください。", photoKind: "placeholder"
  },
  {
    id: "ashinoko", name: "芦ノ湖", category: "湖", latitude: 35.2261, longitude: 138.9974,
    description: "箱根を代表する湖。湖尻側なら元箱根中心部より比較的動きやすいことがありますが、夏休みは所要時間に余裕を持ちます。",
    officialUrl: "https://www.hakonenavi.jp/spot/1024", openingHours: "常時（各施設は別）", closedDays: "なし", priceAdult: "散策無料", priceJuniorHigh: "散策無料", priceElementary: "散策無料", stayMinutes: 50,
    parkingAvailable: true, parkingSpaces: "周辺駐車場あり", rainyDayFriendly: false, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "遊覧船・湖畔駐車場は11〜15時に集中", bestTime: "午前中", tags: ["絶景", "子ども向け", "駐車場あり", "トイレあり"], dataNote: "船・周辺施設の運行状況は各公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "motohakone", name: "元箱根", category: "エリア", latitude: 35.2072, longitude: 139.0252,
    description: "芦ノ湖畔の観光拠点。箱根神社や遊覧船にアクセスできますが、夏休みの昼前後は駐車場待ちを見込みます。",
    officialUrl: "https://www.hakonenavi.jp/spot/169", openingHours: "エリア常時", closedDays: "なし", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "周辺駐車場あり", rainyDayFriendly: false, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "10〜15時は湖畔・国道1号が混みやすい", bestTime: "9時台または15時半以降", tags: ["湖", "飲食店あり", "駐車場あり", "トイレあり"], dataNote: "駐車場の利用条件は現地案内を確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-shrine", name: "箱根神社", category: "神社", latitude: 35.2048, longitude: 139.0262,
    description: "杉並木と芦ノ湖畔の鳥居で知られる神社。階段と行列があるため、暑い時期は短時間でも休憩を組み込みます。",
    officialUrl: "https://hakonejinja.or.jp/", openingHours: "境内自由（授与所等は要確認）", closedDays: "なし", priceAdult: "参拝無料", priceJuniorHigh: "参拝無料", priceElementary: "参拝無料", stayMinutes: 55,
    parkingAvailable: true, parkingSpaces: "あり（混雑時は待機の可能性）", rainyDayFriendly: false, walkingLevel: 4, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "10〜15時は参拝・鳥居撮影で混雑", bestTime: "9時前", tags: ["絶景", "無料", "駐車場あり", "トイレあり"], dataNote: "祈祷・授与所の時間は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "kojiri", name: "湖尻", category: "湖", latitude: 35.2468, longitude: 138.9928,
    description: "芦ノ湖の北岸エリア。桃源台・遊覧船乗り場周辺を含み、元箱根より落ち着いた湖畔の立ち寄り先として使えます。",
    officialUrl: "https://www.hakonenavi.jp/spot/1024", openingHours: "エリア常時（交通機関は別）", closedDays: "なし", priceAdult: "散策無料", priceJuniorHigh: "散策無料", priceElementary: "散策無料", stayMinutes: 40,
    parkingAvailable: true, parkingSpaces: "周辺駐車場あり", rainyDayFriendly: false, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "船・ロープウェイ接続時間帯に増える", bestTime: "午前", tags: ["絶景", "湖", "駐車場あり", "トイレあり"], dataNote: "交通機関の運行は公式案内で確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-yumoto", name: "箱根湯本", category: "エリア", latitude: 35.2321, longitude: 139.1069,
    description: "箱根の玄関口。帰りの立ち寄りには便利ですが、観光客・車が集中しやすく、返却時刻がある日は余裕を多めに取ります。",
    officialUrl: "https://www.hakonenavi.jp/", openingHours: "エリア・店舗により異なる", closedDays: "店舗により異なる", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "周辺有料駐車場", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 4, juniorHighFriendly: 3,
    crowdLevel: 4, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "11〜16時、帰路の15時以降は道路も混みやすい", bestTime: "午前または立ち寄りを省略", tags: ["飲食店あり", "駐車場あり", "トイレあり"], dataNote: "各店舗・駐車場の営業情報は公式案内を確認してください。", photoKind: "placeholder"
  },
  {
    id: "open-air-museum", name: "彫刻の森美術館", category: "美術館", latitude: 35.2507, longitude: 139.0477,
    description: "屋外彫刻と屋内展示が楽しめる美術館。子どもが体を動かせますが、夏は暑さ・屋外歩行量を見込みます。",
    officialUrl: "https://www.hakone-oam.or.jp/", openingHours: "9:00〜17:00（入館は閉館30分前まで）", closedDays: "年中無休（臨時変更は要確認）", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 120,
    parkingAvailable: true, parkingSpaces: "普通車約400台（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 4, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "10〜14時は入館・屋外エリアが混みやすい", bestTime: "開館直後", tags: ["子ども向け", "雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "料金・展示・営業時間は公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "gora-park", name: "強羅公園", category: "自然", latitude: 35.2500, longitude: 139.0491,
    description: "強羅の坂地にあるフランス式整型庭園。体験施設もありますが、傾斜と暑さを考慮して短めの滞在にします。",
    officialUrl: "https://www.hakonenavi.jp/spot/143", openingHours: "9:00〜17:00（季節により変動）", closedDays: "年中無休の場合あり・要確認", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "近隣駐車場を要確認", rainyDayFriendly: false, walkingLevel: 4, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-24", crowdHint: "体験イベントの時間帯に増える", bestTime: "午前", tags: ["子ども向け", "トイレあり"], dataNote: "入園料・体験プログラムは公式サイトで確認してください。", photoKind: "placeholder"
  },
  {
    id: "okada-museum", name: "岡田美術館", category: "美術館", latitude: 35.2439, longitude: 139.0509,
    description: "小涌谷にある東洋美術中心の美術館。屋内で過ごしやすく、暑さや雨を避ける代替候補として組み込みやすい施設です。",
    officialUrl: "https://www.okada-museum.com/guide/", openingHours: "9:00〜17:00（入館は16:30まで）", closedDays: "12月31日・1月1日・展示替期間", priceAdult: "2,800円", priceJuniorHigh: "1,800円", priceElementary: "1,800円", stayMinutes: 100,
    parkingAvailable: true, parkingSpaces: "80台（公式案内）", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "11〜14時は入館・カフェ利用が重なりやすい", bestTime: "9時台または14時以降", tags: ["雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "営業時間・料金・展示替期間は2026-07-26に公式案内を確認。来館前に再確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-checkpoint", name: "箱根関所・資料館", category: "エリア", latitude: 35.1902, longitude: 139.0252,
    description: "芦ノ湖畔に復元された江戸時代の関所。歴史の話題を交えやすく、中学生と小学生の両方が楽しめる立ち寄り候補です。",
    officialUrl: "https://www.hakonesekisyo.jp/", openingHours: "9:00〜17:00（12〜2月は16:30まで、最終入場は30分前）", closedDays: "年中無休", priceAdult: "500円", priceJuniorHigh: "公式サイトで要確認", priceElementary: "250円", stayMinutes: 60,
    parkingAvailable: false, parkingSpaces: "近隣駐車場を要確認", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "元箱根・箱根町周辺は11〜15時に道路と駐車場が混みやすい", bestTime: "9時台", tags: ["湖", "子ども向け", "トイレあり"], dataNote: "営業時間・料金は2026-07-26に公式案内を確認。駐車場は近隣を含めて確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-en-aquarium", name: "箱根園水族館", category: "湖", latitude: 35.1977, longitude: 139.0226,
    description: "芦ノ湖畔の屋内水族館。雨天・暑さの逃げ場になり、バイカルアザラシなどを見られる子ども向けの候補です。",
    officialUrl: "https://www.princehotels.co.jp/amuse/hakone-en/suizokukan/", openingHours: "9:00〜16:30（最終入館は閉館30分前、季節により変更）", closedDays: "公式サイトで要確認", priceAdult: "1,600円", priceJuniorHigh: "1,600円", priceElementary: "800円", stayMinutes: 80,
    parkingAvailable: true, parkingSpaces: "箱根園駐車場（公式案内を確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 3,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "夏休みの昼前後は箱根園駐車場が混みやすい", bestTime: "開館直後", tags: ["湖", "子ども向け", "雨天対応", "駐車場あり", "トイレあり"], dataNote: "営業時間・料金は2026-07-26に公式案内を確認。季節変動があるため来館前に再確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-geo-museum", name: "箱根ジオミュージアム", category: "美術館", latitude: 35.2440, longitude: 139.0216,
    description: "大涌谷くろたまご館1階で、箱根火山の成り立ちを短時間で学べる小規模施設。大涌谷の滞在に屋内要素を足せます。",
    officialUrl: "https://www.hakone-geomuseum.jp/about/", openingHours: "9:00〜16:00", closedDays: "年中無休（天候等による変更あり）", priceAdult: "ジオホール100円（インフォメーションゾーン無料）", priceJuniorHigh: "100円", priceElementary: "100円", stayMinutes: 35,
    parkingAvailable: true, parkingSpaces: "大涌谷周辺駐車場を利用・混雑時は待機の可能性", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "大涌谷の混雑と連動しやすい", bestTime: "9時台", tags: ["子ども向け", "雨天対応", "駐車場あり", "トイレあり"], dataNote: "営業時間・料金は2026-07-26に公式案内を確認。大涌谷の通行・火山情報は当日も確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-museum", name: "箱根美術館", category: "美術館", latitude: 35.2509, longitude: 139.0477,
    description: "日本のやきものと苔庭を楽しめる強羅の美術館。静かな屋内鑑賞と庭園を組み合わせたいときの候補です。",
    officialUrl: "https://moaart.or.jp/hakone/", openingHours: "4〜11月 9:30〜16:30（最終入館16:00）", closedDays: "木曜（祝休日・11月中は開館）・年末年始・展示替え日", priceAdult: "公式サイトで要確認", priceJuniorHigh: "公式サイトで要確認", priceElementary: "公式サイトで要確認", stayMinutes: 75,
    parkingAvailable: true, parkingSpaces: "無料100台（観光協会案内）", rainyDayFriendly: true, walkingLevel: 3, childFriendly: 2, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "午前の入館と庭園散策に来館が集まりやすい", bestTime: "14時以降", tags: ["雨天対応", "駐車場あり", "トイレあり"], dataNote: "営業時間・休館日を2026-07-26に公式案内で確認。企画・庭園状況は来館前に再確認してください。", photoKind: "placeholder"
  },
  {
    id: "sakana-cuisine-ryo", name: "SAKANA CUISINE RYO", category: "飲食", latitude: 35.2565, longitude: 139.1581,
    description: "小田原駅東口から近い海鮮料理店。駅前で車を返す前・受け取った直後の昼食候補として使いやすく、提携駐車場サービスがあります。",
    officialUrl: "https://www.d-ryo.co.jp/", openingHours: "平日ランチ11:30〜14:30／土日祝11:00〜14:30（要確認）", closedDays: "不定休・公式サイトで要確認", priceAdult: "ランチ目安 1,500円〜", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "提携コインパーキング（3,000円以上でサービス券・条件は要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "土日祝の11〜13時は駅前・店内とも混みやすい", bestTime: "11時台前半または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "トイレあり"], dataNote: "駐車サービス・営業時間は2026-07-26に公式／店舗情報で確認。外部口コミ評価は変動する参考値です。", photoKind: "placeholder", reviewScore: "食べログ参考 3.64/5（2026-07-26確認）"
  },
  {
    id: "caffe-terrazza-ukai", name: "カフェテラッツァ うかい", category: "飲食", latitude: 35.2640, longitude: 138.9999,
    description: "箱根ガラスの森美術館内のカフェレストラン。美術館見学と同じ駐車場で完結でき、宿付近で移動を増やしたくない日の食事候補です。",
    officialUrl: "https://www.hakone-garasunomori.jp/restaurant/", openingHours: "10:00〜17:00 L.O.（ランチ時間は曜日により変動・要確認）", closedDays: "美術館休館日に準ずる", priceAdult: "ランチ目安 1,800円〜", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "美術館隣接有料150台・第三駐車場無料（施設利用条件を要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "11〜14時は美術館来館者と重なりやすい", bestTime: "11時前または14時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "宿から近い"], dataNote: "営業時間・利用条件は2026-07-26に施設案内を確認。入館・駐車の条件は来館前に公式サイトで再確認してください。", photoKind: "placeholder", reviewScore: "美術館内のため、外部評価は参考扱い・公式情報を優先"
  },
  {
    id: "yumoto-fujiya-lunch", name: "湯本富士屋ホテル レストラン", category: "飲食", latitude: 35.2328, longitude: 139.1035,
    description: "箱根湯本駅近くのホテル内レストラン群。無料駐車場があり、天候に左右されにくい箱根湯本での食事候補として扱えます。",
    officialUrl: "https://www.yumotofujiya.jp/restaurant/", openingHours: "店舗・曜日により異なる（公式サイトで要確認）", closedDays: "店舗により異なる", priceAdult: "ランチ目安 2,000円〜", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "ホテル無料駐車場（レストラン利用条件を要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "12時前後・週末はレストランと駅周辺道路が混みやすい", bestTime: "11時台または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "トイレあり"], dataNote: "駐車場・営業状況は2026-07-26に公式案内を確認。レストランごとの予約可否と料金を要確認。", photoKind: "placeholder", reviewScore: "店舗別の外部評価は公式／予約サイトで要確認"
  },
  {
    id: "sengokuhara-prince-grill", name: "グリル（箱根仙石原プリンスホテル）", category: "飲食", latitude: 35.2435, longitude: 138.9980,
    description: "仙石原のホテル内レストラン。宿付近から車で動きやすく、駐車場を確保しやすい食事候補として追加しています。",
    officialUrl: "https://www.princehotels.co.jp/hakone-sengokuhara/restaurant/grill/", openingHours: "営業日・ランチ時間は公式サイトで要確認", closedDays: "公式サイトで要確認", priceAdult: "ランチ目安 1,500〜2,500円", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "ホテル駐車場あり（レストラン利用条件を要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 3,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "休日の12時台は予約・宿泊利用と重なりやすい", bestTime: "11時台または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "宿から近い"], dataNote: "営業日・料金・駐車条件は2026-07-26に公式情報を確認。口コミ評価は変動するため予約サイトで再確認してください。", photoKind: "placeholder", reviewScore: "食べログ参考 3.29/5（2026-07-26確認）"
  },
  {
    id: "warabe-saigyodo", name: "わらべ菜魚洞", category: "飲食", latitude: 35.240786, longitude: 139.148738,
    description: "早川漁港に近い海鮮料理店。小田原駅から車で寄りやすく、魚料理を旅の最初か最後に入れたい家族向けの候補です。",
    officialUrl: "https://www.warabe.jp/", openingHours: "11:30〜14:00 L.O.／17:00〜20:30 L.O.（要確認）", closedDays: "水曜夜・公式サイトで要確認", priceAdult: "ランチ目安 1,500〜3,000円", stayMinutes: 65,
    parkingAvailable: true, parkingSpaces: "専用駐車場20台（店舗案内を確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "昼どき・週末は港周辺と店内が混みやすい", bestTime: "開店直後または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け"], dataNote: "営業時間・駐車場・価格は2026-07-26に公式／店舗案内を確認。来店前に公式サイトで再確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "gin-no-ho", name: "ごはんと板前料理 銀の穂", category: "飲食", latitude: 35.260239, longitude: 139.002686,
    description: "仙石原の釜めし・わっぱ飯の店。湿生花園、ラリック美術館、宿付近を組み合わせる日の昼食候補として便利です。",
    officialUrl: "https://www.hakone-susuki.jp/ginnoho", openingHours: "11:00〜14:30／17:00〜20:30（要確認）", closedDays: "水曜・第1・第3火曜（8/12は休業見込み、8/13候補）", priceAdult: "目安 1,000〜3,000円", stayMinutes: 65,
    parkingAvailable: true, parkingSpaces: "無料駐車場20台（店舗案内を確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "12時前後は釜めしの提供時間を含めて混みやすい", bestTime: "11時台前半または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "宿から近い", "子ども向け"], dataNote: "営業時間・休業日・駐車場は2026-07-26に公式／観光案内を確認。釜めしの提供時間を見込んでください。", photoKind: "placeholder", reviewScore: "食べログ参考 3.26/5（掲載情報は変動）"
  },
  {
    id: "sengokuhara-chaya", name: "仙石原茶屋", category: "飲食", latitude: 35.2745, longitude: 138.9973,
    description: "仙石原すすき草原近くの古民家カフェ。短い休憩や軽食を入れたいときに向き、仙石原エリア内で大きく移動せずに済みます。",
    officialUrl: "https://www.sengokubarachaya-hakone.com/", openingHours: "11:00〜17:30 L.O.17:00（営業カレンダーを要確認）", closedDays: "不定休（公式SNS・カレンダーで要確認）", priceAdult: "目安 1,000〜2,000円", stayMinutes: 45,
    parkingAvailable: true, parkingSpaces: "近隣有料駐車場を利用（空き・条件は要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 3,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "午後のカフェ時間帯は席が埋まりやすい", bestTime: "11時台または15時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "宿から近い"], dataNote: "営業日と近隣駐車場は2026-07-26に公式案内を確認。専用駐車場の有無・利用条件は当日も確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "akatsukian-akatsukitei", name: "箱根暁庵本店 暁亭", category: "飲食", latitude: 35.226808, longitude: 139.092854,
    description: "箱根湯本・湯本茶屋のそば処。箱根へ上がる前後に入れやすく、国登録有形文化財の建物で落ち着いて食事をしたいときの候補です。",
    officialUrl: "https://akatsukian.jp/shop-akatsukitei/", openingHours: "11:00〜20:00 L.O.19:30（要確認）", closedDays: "水曜（8/12は休業見込み、8/13候補）", priceAdult: "ランチ目安 2,000〜3,000円", stayMinutes: 65,
    parkingAvailable: true, parkingSpaces: "店舗隣接・第2駐車場あり（台数・空きは公式で要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "昼どき・箱根湯本を通過する時間帯は待ちが出やすい", bestTime: "11時台または14時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応"], dataNote: "営業時間・駐車場・予約可否は2026-07-26に公式／観光案内を確認。旅行直前に公式サイトで再確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "gora-brewery-public-house", name: "GORA BREWERY PUBLIC HOUSE", category: "飲食", latitude: 35.2339, longitude: 139.1017,
    description: "箱根湯本のクラフトビールと窯焼きピザのレストラン。箱根湯本で洋食を選びたいときの候補で、家族でシェアしやすいメニュー構成です。",
    officialUrl: "https://itoh-dining.co.jp/publichouse/", openingHours: "11:30〜21:00（15:00〜16:30はドリンク中心・要確認）", closedDays: "公式サイトで要確認", priceAdult: "ランチ目安 2,000〜3,000円", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "近隣提携・有料駐車場（割引条件は店舗へ要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "箱根湯本の昼食・夕食時間帯は混みやすい", bestTime: "11時半の開店直後または16時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け"], dataNote: "営業時間・提携駐車場の利用条件は2026-07-26に公式／店舗案内を確認。運転者の飲酒はできません。", photoKind: "placeholder", reviewScore: "食べログ参考 3.42/5（掲載情報は変動）"
  },
  {
    id: "tamura-ginkatsutei", name: "田むら銀かつ亭 本店", category: "飲食", latitude: 35.250583, longitude: 139.04928,
    description: "強羅駅近くの豆腐かつ煮で知られる食事処。強羅公園・彫刻の森美術館を組み合わせる日の定食候補として追加しています。",
    officialUrl: "https://ginkatsutei.jp/ginkatsutei-menu/", openingHours: "月・木〜日11:00〜14:30／17:00〜19:00、火11:00〜14:30（要確認）", closedDays: "水曜・火曜夜（8/12は休業見込み、8/13候補）", priceAdult: "ランチ目安 1,000〜2,000円", stayMinutes: 65,
    parkingAvailable: true, parkingSpaces: "店舗駐車場あり（台数・混雑時の案内は公式で要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "有名店のため、休日・昼どきは待ち時間が出やすい", bestTime: "開店直後または14時前", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け"], dataNote: "営業時間・休業日・駐車場は2026-07-26に公式／観光案内を確認。夏休みは待ち時間を見込んでください。", photoKind: "placeholder", reviewScore: "食べログ参考 3.49/5（掲載情報は変動）"
  },
  {
    id: "daruma-ryoriten", name: "だるま料理店", category: "飲食", latitude: 35.2504, longitude: 139.1603,
    description: "小田原城近くの老舗料理店。小田原で車を借りる前後に、海の幸や天ぷらを落ち着いて食べたい日の候補です。",
    officialUrl: "https://darumanet.com/", openingHours: "食堂 11:00〜21:00 L.O.20:00（要確認）", closedDays: "元日・2日、ほか公式で要確認", priceAdult: "ランチ目安 1,500〜3,000円", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "普通車30台（公式案内）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "昼どき・小田原城周辺イベント時は混みやすい", bestTime: "11時台または14時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応"], dataNote: "営業時間・予約・駐車場は2026-07-26に公式案内を確認。来店前に再確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "elenna-gosso", name: "えれんなごっそ", category: "飲食", latitude: 35.2408, longitude: 139.1152,
    description: "鈴廣かまぼこの里にあるバイキングレストラン。小田原・箱根の食材を家族で選びやすく、体験や買い物と同じ駐車場で完結します。",
    officialUrl: "https://www.elennagosso.com/", openingHours: "平日11:00〜16:00／土日祝9:30〜17:00（要確認）", closedDays: "年中無休（臨時変更は公式で要確認）", priceAdult: "ランチ目安 2,000〜3,000円", stayMinutes: 80,
    parkingAvailable: true, parkingSpaces: "鈴廣かまぼこの里 無料300台（施設全体）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "休日の昼どきは家族連れで混みやすい", bestTime: "開店直後または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "トイレあり"], dataNote: "営業時間・料金・駐車場は2026-07-26に公式／小田原観光案内を確認。体験を組み合わせる場合は予約条件を確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "cafe107", name: "えれんなごっそ CAFÉ107", category: "飲食", latitude: 35.2408, longitude: 139.1152,
    description: "鈴廣かまぼこの里の登山電車カフェ。小田原到着直後や帰り道の短い休憩、軽食・スイーツに使いやすい候補です。",
    officialUrl: "https://www.elennagosso.com/cafe107/", openingHours: "10:00〜17:00 L.O.16:30（要確認）", closedDays: "元日・臨時変更は公式で要確認", priceAdult: "軽食・カフェ目安 500〜1,500円", stayMinutes: 40,
    parkingAvailable: true, parkingSpaces: "鈴廣かまぼこの里 無料300台（施設全体）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 3,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "午後のカフェ時間・イベント開催日は席が埋まりやすい", bestTime: "午前または15時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "滞在1時間以内"], dataNote: "営業時間・イベント貸切日は2026-07-26に公式案内を確認。運転者の飲酒はできません。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "irori-chaya", name: "いろり茶屋", category: "飲食", latitude: 35.2637, longitude: 139.0089,
    description: "仙石原の古民家風食事処。囲炉裏料理を中心に、仙石原で座ってゆっくり昼食・夕食を取りたいときの候補です。",
    officialUrl: "https://irorichaya-sengokuhara.com/", openingHours: "11:30〜14:30 L.O.14:00／17:00〜20:00 L.O.19:30（要確認）", closedDays: "水曜（8/12は休業見込み、8/13候補）", priceAdult: "目安 2,000〜4,000円", stayMinutes: 70,
    parkingAvailable: true, parkingSpaces: "駐車場あり・約10〜17台（公式で要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "昼食・夕食の開始時間帯は予約利用と重なりやすい", bestTime: "11時半の開店直後または13時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "宿から近い", "子ども向け"], dataNote: "営業時間・駐車台数・予約可否は2026-07-26に公式案内を確認。来店前に再確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "ramen-kuraichi", name: "RAMEN KURAICHI（ラーメン蔵一）", category: "飲食", latitude: 35.2898, longitude: 138.9994,
    description: "仙石原・金時山登山口近くの喜多方ラーメン店。子どもと短時間で食べたい日や、御殿場側へ向かう前後の昼食候補です。",
    officialUrl: "https://www.ramen-kuraichi.com/", openingHours: "10:30〜15:00 L.O.14:30（要確認）", closedDays: "水曜・第4木曜（8/12は休業見込み、8/13候補）", priceAdult: "ラーメン 980円〜（公式メニュー）", stayMinutes: 50,
    parkingAvailable: true, parkingSpaces: "15台（公式案内）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "general", crowdUpdatedAt: "2026-07-26", crowdHint: "昼どきは登山・ドライブ客で混みやすい", bestTime: "10時半の開店直後または14時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "滞在1時間以内"], dataNote: "営業時間・休業日・駐車場は2026-07-26に公式案内を確認。スープ切れ等は当日店舗へ確認してください。", photoKind: "placeholder", reviewScore: "食べログなどの外部評価はリンク先で確認"
  },
  {
    id: "narukawa-museum", name: "成川美術館", category: "美術館", latitude: 35.2047, longitude: 139.0300,
    description: "芦ノ湖と富士山を望む展望ラウンジと現代日本画の美術館。元箱根・箱根神社周辺の滞在を屋内中心に組み替えたい日にも便利です。",
    officialUrl: "https://www.narukawamuseum.co.jp/", openingHours: "9:00〜17:00", closedDays: "年中無休（8/12・13営業予定、臨時変更は要確認）", priceAdult: "1,500円", priceJuniorHigh: "500円", priceElementary: "500円", stayMinutes: 75,
    parkingAvailable: true, parkingSpaces: "無料70台", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の11〜14時は元箱根道路と駐車場が混みやすい", bestTime: "9時台または15時以降", tags: ["美術館", "絶景", "雨天対応", "駐車場あり", "トイレあり"], dataNote: "営業時間・料金・駐車台数は2026-07-27に公式／箱根観光案内を確認。旅行直前に公式サイトで再確認してください。", photoKind: "placeholder"
  },
  {
    id: "komagatake-ropeway", name: "箱根 駒ヶ岳ロープウェー（芦ノソラ）", category: "絶景", latitude: 35.2001, longitude: 139.0230,
    description: "箱根園から駒ヶ岳山頂へ上るロープウェー。富士山・芦ノ湖の眺望を短時間で楽しめ、箱根園の施設とまとめやすいスポットです。",
    officialUrl: "https://www.princehotels.co.jp/amuse/hakone-en/ropeway/", openingHours: "始発9:00、上り最終16:30・下り最終16:50（季節・天候で変更）", closedDays: "定休日なし（8/12・13運行予定、点検・強風時は運休）", priceAdult: "運賃は公式サイトで要確認", priceJuniorHigh: "運賃は公式サイトで要確認", priceElementary: "運賃は公式サイトで要確認", stayMinutes: 90,
    parkingAvailable: true, parkingSpaces: "箱根園駐車場 約300台・有料", rainyDayFriendly: false, walkingLevel: 2, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆は箱根園入口・乗車列とも混みやすく、天候で待ち時間が変動", bestTime: "9時の始発付近", tags: ["絶景", "子ども向け", "駐車場あり", "トイレあり", "飲食店あり"], dataNote: "運行時間・駐車場は2026-07-27に公式案内を確認。天候による運休があるため当日朝に運行状況を確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-sightseeing-cruise", name: "箱根海賊船（桃源台港）", category: "湖", latitude: 35.2376, longitude: 138.9947,
    description: "桃源台・箱根町港・元箱根港を結ぶ芦ノ湖の観光船。仙石原側から入りやすい桃源台を起点にすると、車移動を増やしすぎず湖上観光を楽しめます。",
    officialUrl: "https://www.hakonenavi.jp/hakone-kankosen/", openingHours: "運航時刻表による（季節・天候で変更）", closedDays: "定休日なし（8/12・13運航予定、荒天時は運休）", priceAdult: "運賃は公式時刻表で要確認", priceJuniorHigh: "運賃は公式時刻表で要確認", priceElementary: "運賃は公式時刻表で要確認", stayMinutes: 80,
    parkingAvailable: true, parkingSpaces: "桃源台周辺に無料・有料駐車場あり", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の10〜15時は乗船待ちと周辺道路が混みやすい", bestTime: "始発寄りまたは15時以降", tags: ["湖", "絶景", "子ども向け", "駐車場あり", "雨天対応", "トイレあり"], dataNote: "2026-07-27に公式案内を確認。2026年夏の正確な便・運賃・運航状況は旅行直前と当日に公式時刻表で確認してください。", photoKind: "placeholder"
  },
  {
    id: "onshi-hakone-park", name: "恩賜箱根公園", category: "自然", latitude: 35.1962, longitude: 139.0263,
    description: "芦ノ湖畔の旧離宮跡地を整備した県立公園。湖と富士山の眺望、資料館、散策路があり、箱根関所とまとめて歩けます。",
    officialUrl: "https://www.kanagawa-park.or.jp/onsisite/", openingHours: "公園は常時利用可／湖畔展望館9:00〜16:30", closedDays: "公園は無休（8/12・13利用可、施設臨時休館は要確認）", priceAdult: "無料", priceJuniorHigh: "無料", priceElementary: "無料", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "有料62台・利用時間7:00〜21:00", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 3, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の日中は箱根町港・関所周辺の道路と駐車場が混みやすい", bestTime: "8〜10時または15時以降", tags: ["自然", "絶景", "無料", "駐車場あり", "トイレあり"], dataNote: "開園・駐車場情報は2026-07-27に神奈川県立公園公式案内を確認。坂と階段があるため歩行量に注意してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-ekiden-museum", name: "箱根駅伝ミュージアム", category: "美術館", latitude: 35.1894, longitude: 139.0248,
    description: "箱根駅伝の歴史や名場面を展示する小規模ミュージアム。箱根町港・関所と近く、中学生にも分かりやすい雨天候補です。",
    officialUrl: "https://www.hakoneekidenmuseum.jp/", openingHours: "平日10:00〜16:30、土休日9:30〜17:00", closedDays: "定休日なし（8/12・13営業予定、臨時休館は要確認）", priceAdult: "650円", priceJuniorHigh: "450円", priceElementary: "450円", stayMinutes: 45,
    parkingAvailable: true, parkingSpaces: "無料5台、満車時は近隣有料駐車場", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 5,
    crowdLevel: 2, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "館内より箱根町港周辺の駐車場が先に混みやすい", bestTime: "10時台または15時以降", tags: ["雨天対応", "子ども向け", "駐車場あり", "滞在1時間以内", "トイレあり"], dataNote: "営業時間・料金・駐車台数は2026-07-27に公式案内を確認。専用駐車場が小さいため近隣駐車場も想定してください。", photoKind: "placeholder"
  },
  {
    id: "earth-museum", name: "神奈川県立生命の星・地球博物館", category: "美術館", latitude: 35.2453, longitude: 139.1212,
    description: "恐竜骨格、隕石、生命の進化などを大型展示で学べる県立博物館。小田原から箱根湯本へ向かう途中にあり、暑さや雨を避けやすい家族向け候補です。",
    officialUrl: "https://nh.kanagawa-museum.jp/", openingHours: "9:00〜16:30（入館16:00まで）", closedDays: "月曜ほか（8/12・13は開館予定、臨時休館は要確認）", priceAdult: "520円", priceJuniorHigh: "無料", priceElementary: "無料", stayMinutes: 100,
    parkingAvailable: true, parkingSpaces: "無料110台", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 3, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "夏休みの午前〜昼は家族連れが増えやすい", bestTime: "9時の開館直後または14時以降", tags: ["雨天対応", "子ども向け", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "開館日・料金・駐車場は2026-07-27に公式案内を確認。特別展示・イベントは別途確認してください。", photoKind: "placeholder"
  },
  {
    id: "yunessun", name: "箱根小涌園ユネッサン", category: "エリア", latitude: 35.2399, longitude: 139.0506,
    description: "水着で遊べる温泉アミューズメントと日帰り温泉。子どもが体を動かせ、雨天や猛暑でも一日候補にしやすい施設です。",
    officialUrl: "https://www.yunessun.com/", openingHours: "ユネッサン9:00〜19:00／森の湯11:00〜20:00（季節により変更）", closedDays: "2026年8/12・13は営業予定（公式の休館日は5月・12月、臨時変更は要確認）", priceAdult: "日程別料金・プランを公式で要確認", priceJuniorHigh: "日程別料金・プランを公式で要確認", priceElementary: "日程別料金・プランを公式で要確認", stayMinutes: 240,
    parkingAvailable: true, parkingSpaces: "有料駐車場あり（台数・料金は公式で要確認）", rainyDayFriendly: true, walkingLevel: 3, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆期間は入場・更衣室・駐車場とも非常に混みやすい", bestTime: "開館直後、事前購入推奨", tags: ["子ども向け", "雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "2026年休館日と通常営業時間は2026-07-27に公式案内を確認。お盆の営業時間・料金・入場制限は直前に再確認してください。", photoKind: "placeholder"
  },
  {
    id: "kamaboko-museum", name: "鈴廣かまぼこ博物館", category: "美術館", latitude: 35.2408, longitude: 139.1152,
    description: "かまぼこの歴史展示と手づくり体験を楽しめる無料の博物館。小田原駅と箱根湯本の間にあり、食事や買い物とまとめやすい立地です。",
    officialUrl: "https://www.kamaboko.com/museum/", openingHours: "9:00〜17:00（体験受付・売店は別時間）", closedDays: "1月1日ほか（8/12・13開館予定。水曜は一部実演・体験内容変更あり）", priceAdult: "入館無料・体験は有料", priceJuniorHigh: "入館無料・体験は有料", priceElementary: "入館無料・体験は有料", stayMinutes: 75,
    parkingAvailable: true, parkingSpaces: "鈴廣かまぼこの里 無料300台", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "夏休みは体験枠と昼食時間帯が混みやすい", bestTime: "9時台または体験を事前予約", tags: ["無料", "雨天対応", "子ども向け", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "開館・駐車場・体験条件は2026-07-27に公式案内を確認。8/12は水曜のため実演内容を予約画面で確認してください。", photoKind: "placeholder"
  },
  {
    id: "odawara-castle", name: "小田原城", category: "エリア", latitude: 35.2508, longitude: 139.1537,
    description: "小田原駅から徒歩圏の城址公園と天守閣。レンタカー受取前後に組み込みやすく、短時間でも小田原らしさを感じられます。",
    officialUrl: "https://odawaracastle.com/", openingHours: "天守閣9:00〜17:00（2026年夏は延長営業日あり）", closedDays: "8/12・13開館予定（12月の指定日・年末年始を除く）", priceAdult: "天守閣510円（共通券等は公式で要確認）", priceJuniorHigh: "200円", priceElementary: "200円", stayMinutes: 90,
    parkingAvailable: true, parkingSpaces: "専用駐車場なし・周辺市営／民間有料駐車場を利用", rainyDayFriendly: false, walkingLevel: 3, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆は城址公園・駅周辺駐車場が混みやすい", bestTime: "9時台または16時前", tags: ["子ども向け", "トイレあり", "飲食店あり"], dataNote: "開館日・夏季延長営業は2026-07-27に公式案内を確認。駅から徒歩利用が楽で、車は周辺有料駐車場を利用してください。", photoKind: "placeholder"
  },
  {
    id: "minaka-odawara", name: "ミナカ小田原", category: "エリア", latitude: 35.2568, longitude: 139.1568,
    description: "小田原駅直結の飲食・物販施設。展望足湯やフードエリアがあり、到着直後の昼食、帰路の買い物、電車待ちを一か所で済ませられます。",
    officialUrl: "https://www.minaka-odawara.jp/", openingHours: "物販10:00〜20:00／飲食11:00〜21:00頃／足湯10:00〜20:00", closedDays: "1月1日ほか（8/12・13営業予定、店舗ごとの休業は要確認）", priceAdult: "入館・足湯無料、飲食は店舗別", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "有料64台、駅周辺駐車場も利用可", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "昼食時・夕方は駐車場とフードエリアが混みやすい", bestTime: "11時前または14時以降", tags: ["無料", "雨天対応", "子ども向け", "駐車場あり", "飲食店あり", "トイレあり", "滞在1時間以内"], dataNote: "営業時間・駐車場は2026-07-27に公式案内を確認。個別店舗の営業は各店舗ページで再確認してください。", photoKind: "placeholder"
  },
  {
    id: "hakone-yuryo", name: "箱根湯寮", category: "エリア", latitude: 35.2314, longitude: 139.0963,
    description: "箱根湯本の里山にある日帰り温泉。帰路に短い休憩を入れやすく、貸切個室露天風呂を選べば家族で落ち着いて過ごせます。",
    officialUrl: "https://www.hakoneyuryo.jp/", openingHours: "平日10:00〜20:00（最終受付19:00）", closedDays: "年中無休（8/12・13営業予定、メンテナンス休業は要確認）", priceAdult: "8/8〜16の特定日料金を公式で要確認", priceJuniorHigh: "料金区分を公式で要確認", priceElementary: "8/8〜16の特定日料金を公式で要確認", stayMinutes: 100,
    parkingAvailable: true, parkingSpaces: "無料92台", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 4,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の午後〜夕方は受付・駐車場とも混みやすい", bestTime: "10時台または予約可能な貸切利用", tags: ["雨天対応", "駐車場あり", "飲食店あり", "トイレあり"], dataNote: "営業時間・駐車台数・2026年8/8〜16の特定日料金案内を2026-07-27に公式で確認。年齢制限・利用規約も確認してください。", photoKind: "placeholder"
  },
  {
    id: "mori-fureai", name: "森のふれあい館・箱根やすらぎの森", category: "自然", latitude: 35.1836, longitude: 139.0142,
    description: "自然展示やクラフト体験の館と、芦ノ湖南岸の森林散策エリア。子どもの興味と天候に合わせて屋内展示と短い散策を組み合わせられます。",
    officialUrl: "https://www.hakone.or.jp/morifure/", openingHours: "3〜11月9:00〜17:00（入館16:30まで）", closedDays: "冬季休館日あり（8/12・13開館予定、臨時変更は要確認）", priceAdult: "650円", priceJuniorHigh: "650円", priceElementary: "400円", stayMinutes: 75,
    parkingAvailable: true, parkingSpaces: "無料80台", rainyDayFriendly: true, walkingLevel: 2, childFriendly: 5, juniorHighFriendly: 4,
    crowdLevel: 2, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "館内は比較的落ち着きやすいが、連休はクラフト体験が混みやすい", bestTime: "午前または14時以降", tags: ["自然", "雨天対応", "子ども向け", "駐車場あり", "トイレあり"], dataNote: "開館・料金・駐車場は2026-07-27に公式案内を確認。散策路は天候と足元に応じて短縮してください。", photoKind: "placeholder"
  },
  {
    id: "totoco-odawara", name: "漁港の駅 TOTOCO小田原", category: "飲食", latitude: 35.241264, longitude: 139.148777,
    description: "小田原漁港近くの海鮮フードコートと物販施設。駐車場が大きく、複数の魚料理から家族それぞれが選びやすい昼食候補です。",
    officialUrl: "https://www.totoco-odawara.com/", openingHours: "1階9:00〜17:00／2階10:00〜17:00 L.O.16:00／3階平日10:59〜16:00 L.O.15:00", closedDays: "年中無休（8/12・13営業予定、臨時変更は要確認）", priceAdult: "目安 1,000〜3,000円", stayMinutes: 65,
    parkingAvailable: true, parkingSpaces: "無料166台", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の11〜14時は注文列・席・駐車場とも非常に混みやすい", bestTime: "10時台または14時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "トイレあり"], dataNote: "営業時間・駐車台数は2026-07-27に公式案内を確認。席予約が難しい形式のためピークを外してください。", photoKind: "placeholder", reviewScore: "小田原の定番海鮮施設。最新の外部評価はリンク先から各店舗情報を確認"
  },
  {
    id: "la-terrazza-ashinoko", name: "ラ・テラッツァ芦ノ湖", category: "飲食", latitude: 35.2027, longitude: 139.0303,
    description: "芦ノ湖畔のイタリアンレストラン。薪窯ピッツァを家族でシェアしやすく、元箱根・成川美術館・箱根神社の移動とまとめられます。",
    officialUrl: "https://www.ashinoko-terrace.jp/", openingHours: "平日10:30〜20:00頃（ラストオーダー・季節変更は要確認）", closedDays: "8月は無休予定（8/12・13営業見込み、臨時変更は要確認）", priceAdult: "ランチ目安 2,000〜4,000円", stayMinutes: 80,
    parkingAvailable: true, parkingSpaces: "専用・提携駐車場の案内あり（約18台、利用条件を要確認）", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の昼は入店待ちと元箱根周辺道路・駐車場が混みやすい", bestTime: "10時半の開店直後または14時半以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "湖", "トイレあり"], dataNote: "営業時間・8月営業・駐車場案内は2026-07-27に公式／施設案内を確認。予約可否と駐車条件を直前に確認してください。", photoKind: "placeholder", reviewScore: "芦ノ湖畔の定番店。最新の外部評価は公式リンク先の予約案内から確認"
  },
  {
    id: "il-miraggio", name: "イル・ミラジィオ（箱根ホテル）", category: "飲食", latitude: 35.1883, longitude: 139.0237,
    description: "箱根ホテルの芦ノ湖を望むフランス料理レストラン。箱根町港・関所と組み合わせやすく、落ち着いた屋内で昼食を取りたい日に向きます。",
    officialUrl: "https://www.hakonehotel.jp/meal/ilmiraggio/index.html", openingHours: "朝食7:30〜10:00／ランチ11:30〜15:00／ディナー18:00〜21:00（ディナー予約制）", closedDays: "定休日なし（8/12・13営業予定、貸切・臨時変更は要確認）", priceAdult: "ランチ目安 3,000〜6,000円", stayMinutes: 90,
    parkingAvailable: true, parkingSpaces: "箱根ホテル駐車場42台", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 4, juniorHighFriendly: 5,
    crowdLevel: 3, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆は宿泊客・予約客で席が埋まりやすい", bestTime: "11時半の予約枠", tags: ["飲食店あり", "駐車場あり", "雨天対応", "湖", "トイレあり"], dataNote: "営業時間・予約条件・駐車場は2026-07-27に公式案内を確認。子ども同伴条件と当日のメニューを予約時に確認してください。", photoKind: "placeholder", reviewScore: "ホテル公式レストラン。最新の外部評価・予約状況は公式リンク先で確認"
  },
  {
    id: "vert-bois", name: "ヴェル・ボワ（山のホテル）", category: "飲食", latitude: 35.2022, longitude: 139.0261,
    description: "芦ノ湖畔の山のホテルにあるフランス料理レストラン。箱根神社周辺で、駐車場所を確保して落ち着いた昼食を取りたい家族向けの候補です。",
    officialUrl: "https://www.hakone-hoteldeyama.jp/restaurant/vertbois/", openingHours: "ランチ11:30〜14:00 L.O.／ディナー17:30〜20:00 L.O.（要予約確認）", closedDays: "ランチ火曜休（8/12水・8/13木は営業予定、臨時変更は要確認）", priceAdult: "ランチ目安 4,000〜8,000円", stayMinutes: 90,
    parkingAvailable: true, parkingSpaces: "山のホテル宿泊・レストラン利用者用駐車場あり", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 3, juniorHighFriendly: 5,
    crowdLevel: 3, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆は予約枠と箱根神社周辺道路が混みやすい", bestTime: "11時半の予約枠", tags: ["飲食店あり", "駐車場あり", "雨天対応", "湖", "トイレあり"], dataNote: "2026年6月からの火曜ランチ定休、営業時間、駐車場を2026-07-27に公式案内で確認。予約と子ども同伴条件を再確認してください。", photoKind: "placeholder", reviewScore: "ホテル公式レストラン。最新の外部評価・空席は公式リンク先で確認"
  },
  {
    id: "nanakamado-hakone-en", name: "どんぶり屋 ななかまど（箱根園）", category: "飲食", latitude: 35.1977, longitude: 139.0226,
    description: "箱根園内の和食・丼料理店。水族館や駒ヶ岳ロープウェーと同じ駐車場を使え、子ども連れで移動を増やさず昼食を取れます。",
    officialUrl: "https://www.princehotels.co.jp/amuse/hakone-en/restaurant/", openingHours: "11:00〜15:00（季節・貸切で変更あり）", closedDays: "定休日なし（8/12・13営業予定、営業状況は要確認）", priceAdult: "目安 1,000〜2,500円", stayMinutes: 60,
    parkingAvailable: true, parkingSpaces: "箱根園駐車場 約300台・有料", rainyDayFriendly: true, walkingLevel: 1, childFriendly: 5, juniorHighFriendly: 5,
    crowdLevel: 4, crowdSource: "forecast", crowdUpdatedAt: "2026-07-27", crowdHint: "お盆の11時半〜14時は箱根園来場者で混みやすい", bestTime: "11時の開店直後または14時以降", tags: ["飲食店あり", "駐車場あり", "雨天対応", "子ども向け", "滞在1時間以内", "トイレあり"], dataNote: "営業時間・定休日・箱根園駐車場は2026-07-27に公式案内を確認。メニューと営業状況を当日に再確認してください。", photoKind: "placeholder", reviewScore: "移動負担の少ない箱根園内候補。最新の外部評価は公式リンク先から確認"
  }
];

export const hotelPoint = {
  id: "hotel", name: "宿泊施設（ガラスの森美術館付近・仮）", latitude: 35.2648, longitude: 138.9988,
};

export const getSpot = (id?: string) => spots.find((spot) => spot.id === id);
