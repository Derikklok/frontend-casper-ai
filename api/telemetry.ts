import { useQuery } from "@tanstack/react-query"

import { telemetryApiInstance } from "@/lib/axios"

export type TelemetryState = {
  driver_id?: string
  lap_number?: number
  total_laps?: number
  laps_remaining?: number
  current_compound?: string
  current_tyre_laps?: number
  track_status?: string
  pit_window_loss?: number
  driving_mode?: string
  track_id?: string
  last_lap_time?: number
  stint_number?: number
  fuel_load_kg?: number
  track_temp?: number
  air_temp?: number
  rainfall_intensity?: number
  humidity?: number
  traffic_density?: number
  position?: number
  race_baseline?: number
}

export type DecisionEnvelope = {
  conditional_branch?: string | null
  confidence?: number
  primary_action?: string
  reasoning?: string
  risk_level?: string
}

export type WeatherIntel = {
  confidence?: number
  crossover_pressure?: number
  delta_gain?: number
  drying?: boolean
  reason?: string
  recommended_compound?: string
  risk?: string
  wetness_index?: number
  deltas?: Record<string, number>
  regime_probs?: Record<string, number>
}

export type TelemetryPrediction = {
  action?: string
  remaining_life?: number
  reasoning?: string
  tyre_stage?: string
  alert_level?: string
  message?: string
  undercut_probability?: number
  predicted_pace_vector?: number[]
  meta?: {
    decision_envelope?: DecisionEnvelope
    weather_intel?: WeatherIntel
  }
}

export type NormalizedTelemetryRecord = {
  telemetry_id: number
  state?: TelemetryState
  prediction?: TelemetryPrediction
  created_at?: string
}

type NormalizedTelemetryResponse = {
  data?: NormalizedTelemetryRecord[]
}

export type NormalizeResponse = {
  status: string
  result: {
    scanned_rows: number
    inserted_rows: number
  }
}

/**
 * Executes the POST /telemetry/normalize endpoint.
 */
export async function normalizeTelemetry(limit = 1000) {
  const response = await telemetryApiInstance.post<NormalizeResponse>(
    "/telemetry/normalize",
    null,
    { params: { limit } }
  )
  return response.data
}

/**
 * Normalizes pending raw logs first, then fetches the normalized data.
 */
export async function getNormalizedTelemetry() {
  // 1. Run normalization first
  try {
    await normalizeTelemetry()
  } catch (error) {
    // Log error, but proceed to fetch existing normalized data rather than breaking the UI
    console.warn("Telemetry normalization warning:", error)
  }

  // 2. Fetch the normalized telemetry records
  const response = await telemetryApiInstance.get<NormalizedTelemetryResponse>(
    "/telemetry/normalized"
  )

  return response.data.data ?? []
}

export function useGetNormalizedTelemetry() {
  return useQuery({
    queryKey: ["normalized-telemetry"],
    queryFn: getNormalizedTelemetry,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}