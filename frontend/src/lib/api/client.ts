// TrafficSense AI — API client

import type {
  AppResponse,
  TrafficSegment,
  Incident,
  WeatherData,
  TrafficPrediction,
  RouteResponse,
  AnalyticsData,
  Alert,
  UserPreferences,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<AppResponse<T>> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new ApiError(text, res.status);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ── Traffic ─────────────────────────────────────────────────────────────

export async function getTrafficData() {
  return fetchApi<TrafficSegment[]>("/api/v1/traffic/current");
}

export async function getIncidents(severity?: string, type?: string) {
  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);
  if (type) params.set("incident_type", type);
  const qs = params.toString();
  return fetchApi<Incident[]>(`/api/v1/traffic/incidents${qs ? `?${qs}` : ""}`);
}

// ── Weather ─────────────────────────────────────────────────────────────

export async function getWeather() {
  return fetchApi<WeatherData>("/api/v1/weather");
}

// ── Predictions ─────────────────────────────────────────────────────────

export async function getPredictions(horizon: number = 15, segmentId?: string) {
  const params = new URLSearchParams({ horizon: String(horizon) });
  if (segmentId) params.set("segment_id", segmentId);
  return fetchApi<TrafficPrediction[]>(`/api/v1/predictions?${params}`);
}

// ── Routes ──────────────────────────────────────────────────────────────

export async function getRoutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  avoidCongestion: boolean = false
) {
  return fetchApi<RouteResponse>("/api/v1/routes", {
    method: "POST",
    body: JSON.stringify({
      origin_lat: originLat,
      origin_lng: originLng,
      destination_lat: destLat,
      destination_lng: destLng,
      avoid_congestion: avoidCongestion,
      avoid_incidents: false,
    }),
  });
}

// ── Analytics ───────────────────────────────────────────────────────────

export async function getAnalytics() {
  return fetchApi<AnalyticsData>("/api/v1/analytics");
}

// ── Alerts ──────────────────────────────────────────────────────────────

export async function getAlerts() {
  return fetchApi<Alert[]>("/api/v1/alerts");
}

// ── Users ───────────────────────────────────────────────────────────────

export async function getUserPreferences() {
  return fetchApi<UserPreferences>("/api/v1/users/preferences");
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>) {
  return fetchApi<UserPreferences>("/api/v1/users/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

// ── Health ──────────────────────────────────────────────────────────────

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  return res.json();
}
