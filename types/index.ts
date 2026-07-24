export type CrowdSource = "realtime" | "forecast" | "general" | "manual";
export type CrowdInfo = {
  level: 1 | 2 | 3 | 4 | 5;
  source: CrowdSource | "none";
  confidence: "low" | "medium" | "high";
  updatedAt?: string;
  reasons: string[];
};

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
  facilityCrowd?: CrowdInfo;
  parkingCrowd?: CrowdInfo;
  roadCrowd?: CrowdInfo;
  bestTime: string;
  tags: string[];
  dataNote: string;
  photoKind: "placeholder" | "official" | "user" | "external";
};

export type ItemType = "spot" | "meal" | "hotel" | "break" | "rental_car" | "transport" | "free" | "travel_note" | "start" | "goal";
export type CustomItemType = "meal" | "break" | "hotel" | "rental_car" | "transport" | "free" | "travel_note";
export type RentalCarAction = "pickup" | "return" | "procedure" | "refuel" | "other";
export type TransportMode = "train" | "bus" | "walk" | "taxi" | "other";
export type TransportAction = "board" | "exit" | "transfer" | "move";

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
  /** 個人情報が入り得るため、共有時は既定で除外する。 */
  note?: string;
  locationName?: string;
  address?: string;
  isReserved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** 利用者が追加した一般予定。既存の宿泊地点と区別して集計する。 */
  isCustom?: boolean;
  /** レンタカーの受取・返却など、種類ごとの補足。 */
  subtype?: RentalCarAction;
  transportMode?: TransportMode;
  transportAction?: TransportAction;
  departureTime?: string;
  arrivalTime?: string;
  destinationName?: string;
  /** フェーズ2-C2-B3で帰着計算に利用する予約済みの意図フラグ。 */
  useForReturnTrip?: boolean;
};

export type RoutePoint = { latitude: number; longitude: number };
export type RouteResult = {
  geometry: [number, number][];
  source: "routing" | "fallback";
};

/** 道路経路の取得状況。fallback は道路形状を取得できず、直線の参考線を表示している状態。 */
export type RouteMode = RouteResult["source"] | "loading" | "slow";

export type ReturnSettings = {
  dinnerTime: string;
  arrivalStation: "東京駅" | "品川駅" | "新宿駅" | "渋谷駅";
  rentalReturnMinutes: number;
  transferMinutes: number;
  delayBufferMinutes: number;
};

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
  returnSettings?: ReturnSettings;
};

export type SharedTripPayload = {
  version: 1;
  createdAt: string;
  trip: Pick<TripState, "itinerary" | "hotelName" | "activeFilters" | "crowdMode" | "visitTime" | "weather" | "returnSettings"> & {
    travelDates: "2026-08-12/2026-08-13";
    party: "大人2・中学生1・小学生1";
  };
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
