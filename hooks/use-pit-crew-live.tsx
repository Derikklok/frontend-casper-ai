"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Cookies from "js-cookie"

export interface StrategyPayload {
  id?: string
  action: "BOX_THIS_LAP" | "STAY_OUT" | "UNDERCUT_PUSH" | string
  target_compound: "SOFT" | "MEDIUM" | "HARD" | "INTER" | "WET" | string | null
  remaining_life: number
  predicted_pace_vector: number[]
  reasoning: string
  tyre_stage: string
  alert_level: "GREEN" | "AMBER" | "RED" | string
  message: string
  undercut_probability: number
  driverName?: string
  driverNumber?: number
  currentLap?: number
  meta?: {
    decision_envelope?: {
      primary_action: string
      confidence: number
      risk_level: string
      reasoning: string
    }
    weather_intel?: {
      recommended_compound: string
      regime_probs?: Record<string, number>
      wetness_index?: number
    }
  }
}

export function usePitCrewLive() {
  const [strategy, setStrategy] = useState<StrategyPayload | null>(null)
  const [isConnected, setIsConnected] = useState(false)
   const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date())
  const socketRef = useRef<WebSocket | null>(null)
  const connectWebSocketRef = useRef<() => void>(() => {})
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Initial snapshot fetch via HTTP REST fallback
  const fetchLatestSnapshot = useCallback(async () => {
    try {
      const token = Cookies.get("token") || (typeof window !== "undefined" ? localStorage.getItem("token") : null)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api"}/strategy/latest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const data = await res.json()
      if (data?.result) {
        setStrategy({
          id: data.result.id,
          action: data.result.action,
          target_compound: data.result.targetCompound,
          remaining_life: data.result.remainingLife,
          predicted_pace_vector: data.result.predictedPaceVector || [],
          reasoning: data.result.reasoning,
          tyre_stage: data.result.tyreStage,
          alert_level: data.result.alertLevel,
          message: data.result.message,
          undercut_probability: data.result.undercutProbability,
          driverName: data.result.driverName,
          driverNumber: data.result.driverNumber,
          currentLap: data.result.currentLap,
          meta: data.result.metaEnvelope,
        })
      }
    } catch {
      // Offline or backend not ready yet
    }
  }, [])

  // 2. Native WebSocket Connection
  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9090/api/ws-pitwall"

    try {
      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setLastHeartbeat(new Date())

        // STOMP CONNECT frame over standard WebSocket
        ws.send("CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0")

        // Subscribe to pit crew topic
        const subFrame = "SUBSCRIBE\nid:sub-0\ndestination:/topic/pit-crew\n\n\0"
        ws.send(subFrame)
      }

      ws.onmessage = (event) => {
        setLastHeartbeat(new Date())
        const dataStr = event.data

        // If STOMP MESSAGE frame received
        if (typeof dataStr === "string" && dataStr.startsWith("MESSAGE")) {
          const bodyIndex = dataStr.indexOf("\n\n")
          if (bodyIndex !== -1) {
            const rawBody = dataStr.slice(bodyIndex + 2).replace(/\0$/, "")
            try {
              const parsed = JSON.parse(rawBody)
              setStrategy({
                id: parsed.id,
                action: parsed.action,
                target_compound: parsed.targetCompound || parsed.target_compound,
                remaining_life: parsed.remainingLife ?? parsed.remaining_life ?? 0,
                predicted_pace_vector: parsed.predictedPaceVector || parsed.predicted_pace_vector || [],
                reasoning: parsed.reasoning,
                tyre_stage: parsed.tyreStage || parsed.tyre_stage,
                alert_level: parsed.alertLevel || parsed.alert_level,
                message: parsed.message,
                undercut_probability: parsed.undercutProbability ?? parsed.undercut_probability ?? 0,
                driverName: parsed.driverName,
                driverNumber: parsed.driverNumber,
                currentLap: parsed.currentLap,
                meta: parsed.metaEnvelope || parsed.meta,
              })
            } catch (err) {
              console.error("[WS] Failed to parse message body:", err)
            }
          }
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Automatic exponential reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocketRef.current()
        }, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch (e) {
      console.error("[WS] Connection initialization failed:", e)
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocketRef.current()
      }, 5000)
    }
  }, [])

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket
    const initializationTimeout = setTimeout(() => {
      void fetchLatestSnapshot()
      connectWebSocket()
    }, 0)

    return () => {
      clearTimeout(initializationTimeout)
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (socketRef.current) socketRef.current.close()
    }
  }, [fetchLatestSnapshot, connectWebSocket])

  return { strategy, isConnected, lastHeartbeat, setStrategy }
}