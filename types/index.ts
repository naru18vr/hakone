export type CrowdSource = "realtime" | "forecast" | "general" | "manual";

export type SpotCategory =
  | "美術館"
  | "自然"
  | "絶景"
  | "湖"
  | "神社"
  | "エリア"
  | "駅";

export type Spot = {
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
  priceJuniorHigh?: string;
  priceElementary?: string;
  stayMinutes: number;
  parkingAvailable: boolean;
  parkingSpaces?: string;
  rainyDayFriendly: boolean;
  walkingLevel: 1 | 2 | 3 | 4 | 5;
  childFriendly: 1 | 2 | 3 | 4 | 5;
  juniorHighFriendly: 1 | 2 | 3 | 4 | 5;
  crowdLevel: 1 | 2 | 3 | 4;
  crowdSource: CrowdSource;
  crowdUpdatedAt: string;
  crowdHint: string;
  bestTime: string;
  tags: string[];
  dataNote: string;
  photoKind: "placeholder" | "official" | "user" | "external";
};

export type ItemType = "spot" | "meal" | "hotel" | "break" | "start" | "goal";

export type ItineraryItem = {
  id: string;
  day: 1 | 2;
  type: ItemType;
  spotId?: string;
  title: string;
  startTime?: string;
  endTime?: string;
  stayMinutes: number;
  order: number;
  latitude?: number;
  longitude?: number;
};

export type RoutePoint = { latitude: number; longitude: number };
export type RouteResult = {
  geometry: [number, number][];
  source: "routing" | "fallback";
};

/** 道路経路の取得状況。fallback は道路形状を取得できず、直線の参考線を表示している状態。 */
export type RouteMode = RouteResult["source"] | "loading";

export type TripState = {
  itinerary: ItineraryItem[];
  hotelName: string;
  selectedSpotId?: string;
  activeDay: 1 | 2;
  routeDay: 1 | 2 | "all";
  activeFilters: string[];
  crowdMode: "forecast" | "general";
  visitTime: string;
  weather: "晴れ" | "雨" | "くもり";
};

/** LocalStorage に保存する、明示的にバージョン管理された旅程データ。 */
export type SavedTripState = {
  version: 1;
  savedAt: string;
  data: TripState;
};

export type SamplePlan = {
  id: string;
  name: string;
  subtitle: string;
  focus: string;
  caution: string;
  itinerary: ItineraryItem[];
};
