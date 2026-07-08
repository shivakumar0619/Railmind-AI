export type SignalAspect = "clear" | "attention" | "caution" | "stop";
export type TrainStatus = "running" | "waiting" | "at_station" | "stopped" | "delayed";

export interface StationWeather {
  condition: string;
  temp_c: number;
  wind_kmh: number;
  visibility_km?: number;
}

export interface TrainBrief {
  id: string;
  number: string;
  name: string;
  status: string;
  delay_minutes: number;
  eta?: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  platforms: number;
  zone: string;
  division: string;
  km: number;
  is_junction: boolean;
  status: string;
  electrified: boolean;
  occupancy?: number;
  occupied_platforms?: number;
  weather?: StationWeather;
  arrivals?: TrainBrief[];
  departures?: TrainBrief[];
  nearby_trains?: TrainBrief[];
}

export interface RouteSection {
  id: string;
  code: string;
  name: string;
  corridor: string;
  line: string;
  source_code: string;
  target_code: string;
  distance_km: number;
  total_distance_km: number;
  stations_count: number;
  track_type: "single" | "double" | "quad";
  electrified: boolean;
  max_speed_kmh: number;
  block_count: number;
  status: string;
  operational_status: string;
  via: string[];
  polyline: [number, number][];
  current_trains?: number;
  congestion?: "low" | "medium" | "high";
  average_delay_minutes?: number;
  travel_time_minutes?: number;
  occupied?: boolean;
  occupied_blocks?: number[];
}

export interface Signal {
  id: string;
  name: string;
  type: string;
  station_code: string;
  route_id: string;
  block_id: string;
  block_index: number;
  total_blocks: number;
  direction: string;
  aspect: SignalAspect;
  status: string;
  health: number;
  health_score: number;
  occupied: boolean;
  failure: boolean;
  maintenance: boolean;
  lat: number;
  lng: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: string;
  status: TrainStatus | string;
  origin: string;
  destination: string;
  via: string[];
  route: string;
  current_route_id: string;
  current_station: string;
  next_station: string;
  current_speed_kmh: number;
  speed_kmh: number;
  max_speed_kmh: number;
  delay_minutes: number;
  eta: string;
  platform: string;
  progress_pct: number;
  direction: string;
  lat: number;
  lng: number;
  bearing: number;
  block_id: string;
  section: string;
  corridor: string;
}

export interface DigitalTwinData {
  stations: Station[];
  routes: RouteSection[];
  signals: Signal[];
  trains: Train[];
}

export type DigitalTwinEntity =
  | { type: "train"; item: Train }
  | { type: "station"; item: Station }
  | { type: "signal"; item: Signal }
  | { type: "route"; item: RouteSection };

export interface LayerFilters {
  stations: boolean;
  junctionsOnly: boolean;
  signals: boolean;
  trains: boolean;
  occupiedOnly: boolean;
}
