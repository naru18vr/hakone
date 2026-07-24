import { Spot } from "@/types";

/**
 * 初期表示用の静的データです。営業時間・料金は変更されるため、表示時にも
 * 公式サイトを開けるようにしています。最終見直し: 2026-07-24。
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
  }
];

export const hotelPoint = {
  id: "hotel", name: "宿泊施設（ガラスの森美術館付近・仮）", latitude: 35.2648, longitude: 138.9988,
};

export const getSpot = (id?: string) => spots.find((spot) => spot.id === id);
