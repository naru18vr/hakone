import { hotelPoint } from "@/data/spots";
import { ItineraryItem, SamplePlan } from "@/types";

const point = (id: string, day: 1 | 2, type: ItineraryItem["type"], title: string, stayMinutes: number, order: number, latitude?: number, longitude?: number, spotId?: string): ItineraryItem => ({
  id, day, type, title, stayMinutes, order, latitude, longitude, spotId,
});

const station = (day: 1 | 2, type: "start" | "goal", order: number) => point(
  `${type}-${day}`, day, type, "小田原駅", type === "start" ? 20 : 25, order, 35.2569, 139.1557, "odawara-station",
);
const hotel = (day: 1 | 2, order: number) => point(
  `hotel-${day}`, day, "hotel", hotelPoint.name, 30, order, hotelPoint.latitude, hotelPoint.longitude,
);
const spot = (id: string, day: 1 | 2, title: string, stayMinutes: number, order: number, latitude: number, longitude: number) => point(
  `${id}-${day}`, day, "spot", title, stayMinutes, order, latitude, longitude, id,
);
const meal = (id: string, day: 1 | 2, title: string, order: number, latitude: number, longitude: number) => point(id, day, "meal", title, 60, order, latitude, longitude);

export const samplePlans: SamplePlan[] = [
  {
    id: "sengokuhara", name: "プランA：仙石原完結型", subtitle: "最も楽なプラン", focus: "移動距離が短く、予定を変えやすい。", caution: "8月のすすき草原は短い散策向きです。",
    itinerary: [
      station(1, "start", 1), meal("lunch-odawara", 1, "小田原で昼食", 2, 35.2557, 139.1544), spot("glass-forest", 1, "箱根ガラスの森美術館", 100, 3, 35.2640, 138.9999), hotel(1, 4),
      hotel(2, 1), spot("wetland-garden", 2, "箱根湿生花園", 70, 2, 35.2718, 138.9917), spot("lalique", 2, "箱根ラリック美術館", 75, 3, 35.2615, 139.0006), meal("lunch-sengoku", 2, "仙石原で昼食", 4, 35.2624, 138.9995), spot("susuki", 2, "仙石原すすき草原", 35, 5, 35.2860, 138.9942), station(2, "goal", 6),
    ],
  },
  {
    id: "lake", name: "プランB：仙石原＋芦ノ湖", subtitle: "混雑回避プラン", focus: "元箱根中心部を避け、湖尻側の景色を楽しむ。", caution: "船やロープウェイを使う場合は運行状況を確認。",
    itinerary: [
      station(1, "start", 1), meal("lunch-odawara-b", 1, "小田原で昼食", 2, 35.2557, 139.1544), spot("glass-forest", 1, "箱根ガラスの森美術館", 100, 3, 35.2640, 138.9999), hotel(1, 4),
      hotel(2, 1), spot("visitor-center", 2, "箱根ビジターセンター", 35, 2, 35.2757, 138.9973), spot("kojiri", 2, "湖尻", 40, 3, 35.2468, 138.9928), meal("lunch-kojiri", 2, "湖尻で昼食", 4, 35.2462, 138.9935), spot("pola", 2, "ポーラ美術館", 110, 5, 35.2622, 139.0053), station(2, "goal", 6),
    ],
  },
  {
    id: "rain-museum", name: "プランC：雨天・美術館中心", subtitle: "雨天対応プラン", focus: "屋内中心で、暑さ・雨・疲労を抑えやすい。", caution: "企画展の休館日は入替が必要です。",
    itinerary: [
      station(1, "start", 1), meal("lunch-odawara-c", 1, "小田原で昼食", 2, 35.2557, 139.1544), spot("glass-forest", 1, "箱根ガラスの森美術館", 100, 3, 35.2640, 138.9999), hotel(1, 4),
      hotel(2, 1), spot("lalique", 2, "箱根ラリック美術館", 75, 2, 35.2615, 139.0006), meal("lunch-sengoku-c", 2, "仙石原で昼食", 3, 35.2624, 138.9995), spot("pola", 2, "ポーラ美術館", 110, 4, 35.2622, 139.0053), station(2, "goal", 5),
    ],
  },
  {
    id: "owakudani", name: "プランD：大涌谷を入れる案", subtitle: "箱根らしさ重視", focus: "大涌谷を早朝に置き、午後の混雑を避ける。", caution: "混雑・火山情報により大涌谷を外す判断が必要です。",
    itinerary: [
      station(1, "start", 1), meal("lunch-odawara-d", 1, "小田原で昼食", 2, 35.2557, 139.1544), spot("glass-forest", 1, "箱根ガラスの森美術館", 100, 3, 35.2640, 138.9999), hotel(1, 4),
      hotel(2, 1), spot("owakudani", 2, "大涌谷（早朝）", 80, 2, 35.2437, 139.0211), spot("wetland-garden", 2, "箱根湿生花園", 70, 3, 35.2718, 138.9917), meal("lunch-sengoku-d", 2, "仙石原で昼食", 4, 35.2624, 138.9995), station(2, "goal", 5),
    ],
  },
];

export const initialPlan = samplePlans[0];
