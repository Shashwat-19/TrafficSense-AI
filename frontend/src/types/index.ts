// TrafficSense AI — TypeScript types matching backend Pydantic models

export type CongestionLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";
export type IncidentType = "ACCIDENT" | "ROAD_CLOSURE" | "CONSTRUCTION" | "CONGESTION" | "OBSTRUCTION" | "OTHER";
export type IncidentSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AlertType = "SEVERE_CONGESTION" | "MAJOR_INCIDENT" | "ROUTE_DELAY" | "TRAFFIC_INCREASE" | "WEATHER_RISK";
export type AlertSeverityType = "INFO" | "WARNING" | "CRITICAL";

export interface TrafficSegment {
  id: string;
  road_name: string;
  latitude: number;
  longitude: number;
  current_speed: number;
  free_flow_speed: number;
  congestion_ratio: number;
  congestion_level: CongestionLevel;
  delay_seconds: number;
  confidence: number;
  timestamp: string;
  source: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  description: string;
  road_name?: string;
  start_time: string;
  end_time?: string;
  source: string;
}

export interface WeatherData {
  temperature: number;
  feels_like?: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_direction?: number;
  visibility: number;
  precipitation: number;
  pressure?: number;
  timestamp: string;
  source: string;
}

export interface TrafficPrediction {
  segment_id: string;
  road_name: string;
  horizon_minutes: number;
  predicted_speed: number;
  predicted_congestion: number;
  predicted_level: CongestionLevel;
  confidence: number;
  current_speed?: number;
  current_congestion?: number;
  timestamp: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteAlternative {
  id: string;
  name: string;
  distance_km: number;
  travel_time_seconds: number;
  delay_seconds: number;
  congestion_level: CongestionLevel;
  congestion_ratio: number;
  points: RoutePoint[];
  summary: string;
}

export interface RouteResponse {
  origin: RoutePoint;
  destination: RoutePoint;
  alternatives: RouteAlternative[];
}

export interface CongestionDistribution {
  level: CongestionLevel;
  count: number;
  percentage: number;
}

export interface HourlyPattern {
  hour: number;
  avg_speed: number;
  avg_congestion: number;
  segment_count: number;
}

export interface TopCongestedRoad {
  road_name: string;
  congestion_ratio: number;
  congestion_level: CongestionLevel;
  current_speed: number;
  free_flow_speed: number;
}

export interface IncidentStats {
  type: string;
  count: number;
}

export interface AnalyticsData {
  overall_congestion: number;
  overall_level: CongestionLevel;
  avg_speed: number;
  total_segments: number;
  total_incidents: number;
  congestion_distribution: CongestionDistribution[];
  hourly_patterns: HourlyPattern[];
  top_congested_roads: TopCongestedRoad[];
  incident_stats: IncidentStats[];
  speed_vs_freeflow: { road_name: string; current_speed: number; free_flow_speed: number }[];
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverityType;
  title: string;
  message: string;
  latitude?: number;
  longitude?: number;
  road_name?: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  label: string;
}

export interface RecentRoute {
  id: string;
  origin_name: string;
  destination_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  searched_at: string;
}

export interface UserPreferences {
  notifications_enabled: boolean;
  default_map_center_lat: number;
  default_map_center_lng: number;
  default_map_zoom: number;
  preferred_units: string;
  saved_locations: SavedLocation[];
  recent_routes: RecentRoute[];
  favorite_areas: string[];
  alert_types: AlertType[];
}

export interface AppResponse<T = unknown> {
  data: T;
  data_mode: "live" | "demo";
  last_updated: string;
  source: string;
}

// ── Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
  tools_used?: string[];
  actions?: ChatAction[];
  isLoading?: boolean;
  isError?: boolean;
}

export interface ChatAction {
  type: "FOCUS_MAP" | "SHOW_ROUTE" | "SHOW_INCIDENTS" | "SHOW_ANALYTICS" | "SHOW_PREDICTION";
  latitude?: number;
  longitude?: number;
  zoom?: number;
  data?: unknown;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  sources: string[];
  tools_used: string[];
  actions: ChatAction[];
  timestamp: string;
}
