"use client"

import { useMemo, useState, useRef } from "react"
import {
  AlertTriangle,
  Car,
  Clock3,
  Fuel,
  Map,
  Sparkles,
  Users,
  Waves,
  Wifi,
  XCircle,
  Send,
  Loader2,
} from "lucide-react"
import Cookies from "js-cookie"
import { toast } from "sonner"

import MultiStopPlanner from "@/components/pit-wall/MultiStopPlanner"
import TelemetryDisplay from "@/components/pit-wall/TelemetryDisplay"
import AiStrategyPanel from "@/components/pit-wall/AiStrategyPanel"
import InitialStartegy from "@/components/initial-strategy/InitialStartegy"
import { useGetActiveSequence } from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import {
  useGetCircuits,
  useGetDrivers,
  useGetCars,
} from "@/api/endpoints/asset-controller/asset-controller"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SessionType = "Practice 1" | "Practice 2" | "Qualifying" | "Race"
type TrackStatus = "Green Flag" | "VSC" | "Safety Car"
type StrategyDecision = "Pending" | "Approved" | "Rejected"
type PendingAiPrediction = {
  action?: string
  target_compound?: string | null
  remaining_life?: number
  predicted_pace_vector?: number[]
  reasoning?: string
  tyre_stage?: string
  alert_level?: "GREEN" | "YELLOW" | "RED"
  message?: string
  undercut_probability?: number
  meta?: Record<string, unknown>
}
// Mock Live Trace Data
const liveTelemetryData = Array.from({ length: 28 }).map((_, index) => ({
  lap: index + 1,
  speed: 170 + Math.sin(index / 2) * 24 + (index % 5) * 3,
  throttle: 55 + Math.cos(index / 3) * 18 + (index % 4) * 2,
}))

const initialPitHistory = [
  {
    lap: 9,
    action: "Soft -> Medium",
    duration: "2.4s",
    note: "Undercut secured",
  },
  {
    lap: 23,
    action: "Medium -> Hard",
    duration: "2.7s",
    note: "Defend position",
  },
  {
    lap: 41,
    action: "Fuel delta adjustment",
    duration: "1.1s",
    note: "Under VSC",
  },
]

function TelemetryItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/3 p-3">
      <div className="font-quicksand text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-lg font-bold", color)}>{value}</div>
    </div>
  )
}

export default function PitWallPage() {
  const [session] = useState<SessionType>("Race")
  const [trackStatus] = useState<TrackStatus>("Green Flag")
  const [currentLap] = useState(16)
  const [totalLaps] = useState(58)
  const [tireAge] = useState(11)
  const [fuelLoad] = useState(43)
  const [trackTemp] = useState(34)
  const [decision, setDecision] = useState<StrategyDecision>("Pending")
  const [decisionMessage, setDecisionMessage] = useState(
    "Awaiting engineer review."
  )
  const [pitHistory, setPitHistory] = useState(initialPitHistory)

  const currentCompound = "MEDIUM"
  const tyreAge = 15
  const recentLapTimes = ["80.5", "80.7", "80.9", "81.2", "81.5"]

  // AI Output State
  const [predictedPaceVector, setPredictedPaceVector] = useState<number[]>([])
  
  // Pending AI Prediction staging state waiting for Race Engineer approval
  const [pendingAiPrediction, setPendingAiPrediction] =
    useState<PendingAiPrediction | null>(null)
  const [isDispatching, setIsDispatching] = useState(false)

  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------
  const activeSequenceQuery = useGetActiveSequence()
  const driversQuery = useGetDrivers()
  const circuitsQuery = useGetCircuits()
  const carsQuery = useGetCars()

  const activeSequence = activeSequenceQuery.data?.result
  const drivers = useMemo(() => driversQuery.data?.result ?? [], [driversQuery.data?.result])
  const circuits = useMemo(() => circuitsQuery.data?.result ?? [], [circuitsQuery.data?.result])
  const cars = useMemo(() => carsQuery.data?.result ?? [], [carsQuery.data?.result])

  const payloadRef = useRef<(() => Record<string, unknown>) | null>(null)

  const effectiveDriver = useMemo(
    () =>
      drivers.find((driver) => driver.id === activeSequence?.driverId) ??
      drivers[0],
    [activeSequence?.driverId, drivers]
  )
  const effectiveCircuit = useMemo(
    () =>
      circuits.find((circuit) => circuit.id === activeSequence?.circuitId) ??
      circuits[0],
    [activeSequence?.circuitId, circuits]
  )
  const effectiveCar = useMemo(
    () => cars.find((car) => car.id === activeSequence?.carId) ?? cars[0],
    [activeSequence?.carId, cars]
  )

  // ------------------------------------------------------------------
  // Execute Staged Strategy to Backend & Pit Crew WebSocket
  // ------------------------------------------------------------------
  const handleExecuteStrategy = async () => {
    if (!pendingAiPrediction) return

    setIsDispatching(true)
    try {
      const token =
        Cookies.get("auth_token") ||
        (typeof window !== "undefined" ? localStorage.getItem("auth-token") : null)

      const payload = {
        sequenceId: activeSequence?.id,
        driverId: effectiveDriver?.id,
        currentLap: currentLap,
        action: pendingAiPrediction.action,
        target_compound: pendingAiPrediction.target_compound,
        remaining_life: pendingAiPrediction.remaining_life ?? 0,
        predicted_pace_vector: pendingAiPrediction.predicted_pace_vector ?? [],
        reasoning: pendingAiPrediction.reasoning ?? "",
        tyre_stage: pendingAiPrediction.tyre_stage ?? "STABLE",
        alert_level: pendingAiPrediction.alert_level ?? "GREEN",
        message: pendingAiPrediction.message ?? "",
        undercut_probability: pendingAiPrediction.undercut_probability ?? 0,
        meta: pendingAiPrediction.meta ?? {},
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api"}/strategy/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`)
      }

      const data = await res.json()

      if (data.success) {
        setDecision("Approved")
        setDecisionMessage(
          `Strategy [${pendingAiPrediction.action}] executed and broadcasted to Pit Crew.`
        )

        // Append to local pit log
        setPitHistory((prev) => [
          {
            lap: currentLap,
            action: pendingAiPrediction.target_compound
              ? `${currentCompound} -> ${pendingAiPrediction.target_compound}`
              : pendingAiPrediction.action ?? "Strategy action",
            duration: "PENDING",
            note: pendingAiPrediction.reasoning || "Executed via Pit Wall HUD",
          },
          ...prev,
        ])

        toast.success("Strategy dispatched to Pit Crew Live Wall", {
          description: `Action: ${pendingAiPrediction.action} | Alert: ${pendingAiPrediction.alert_level}`,
        })
        setPendingAiPrediction(null)
      } else {
        throw new Error(data.message || "Failed to execute strategy")
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not reach Spring backend."
      console.error("[PitWall] Failed to dispatch strategy:", err)
      toast.error("Execution dispatch failed", {
        description: message,
      })
    } finally {
      setIsDispatching(false)
    }
  }

  const handleRejectStrategy = () => {
    setDecision("Rejected")
    setDecisionMessage("AI Recommendation rejected by Race Engineer.")
    setPendingAiPrediction(null)
    toast.info("Strategy recommendation rejected", {
      description: "Call dismissed. Standby for subsequent telemetry delta.",
    })
  }

  return (
    <main className="pit-wall-shell relative min-h-full overflow-auto">
      <div className="pointer-events-none absolute inset-0"></div>

      <div className="relative mx-auto max-w-[1600px] space-y-6 p-6">
        {/* TELEMETRY TOP RIBBON */}
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 animate-pulse text-green-500" />
              <span className="font-mono text-sm font-bold tracking-widest text-green-400">
                LIVE TELEMETRY
              </span>
            </div>

            <Badge className="border-green-500/30 bg-green-500/10 text-green-400">
              LIVE
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <TelemetryItem
              label="POSITION"
              value="P2"
              color="text-yellow-400"
            />
            <TelemetryItem label="LAP" value="16 / 52" />
            <TelemetryItem label="SPEED" value="286 km/h" />
            <TelemetryItem label="RPM" value="11,240" />
            <TelemetryItem label="GEAR" value="7" />
            <TelemetryItem label="DRS" value="OPEN" color="text-green-400" />
            <TelemetryItem label="ERS" value="74%" color="text-cyan-400" />
            <TelemetryItem label="FUEL" value="43 kg" color="text-green-400" />
            <TelemetryItem label="TYRE" value="SOFT" color="text-red-400" />
            <TelemetryItem label="TYRE AGE" value="15 Laps" />
            <TelemetryItem label="TRACK" value="34°C" color="text-orange-400" />
            <TelemetryItem label="AIR" value="26°C" />
            <TelemetryItem label="HUMIDITY" value="61%" color="text-sky-400" />
            <TelemetryItem label="WIND" value="12 km/h" />
            <TelemetryItem label="WEATHER" value="CLEAR" color="text-green-400" />
            <TelemetryItem label="LAST LAP" value="1:28.441" />
          </div>
        </section>

        {/* ACTIVE PILOT & CAR SNAPSHOT */}
        <section className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-6">
            {[
              {
                label: "Active Pilot",
                value:
                  effectiveDriver?.broadcastName ??
                  effectiveDriver?.fullName ??
                  "Unassigned",
                icon: Users,
                tone: "text-primary",
              },
              {
                label: "Circuit",
                value: effectiveCircuit?.name ?? "Unknown circuit",
                icon: Map,
                tone: "text-amber-500",
              },
              {
                label: "Chassis",
                value: effectiveCar?.name ?? "Unknown car",
                icon: Car,
                tone: "text-cyan-500",
              },
              {
                label: "Fuel Load",
                value: `${fuelLoad} KG`,
                icon: Fuel,
                tone: "text-green-500",
              },
            ].map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-6">
                {index > 0 && (
                  <div className="hidden h-8 w-px bg-border/40 md:block" />
                )}
                <div className="flex flex-col">
                  <span className="font-quicksand text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {stat.label}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-lg font-bold text-foreground">
                    <stat.icon className={`h-4 w-4 ${stat.tone}`} /> {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Badge className="self-center rounded-sm border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            SYS_READY
          </Badge>
        </section>

        {/* STAGED STRATEGY EXECUTION BANNER (TRIGGERS ON PREDICTION) */}
        {pendingAiPrediction && (
          <section className="relative overflow-hidden rounded-xl border-2 border-primary/80 bg-zinc-950 p-6 shadow-[0_0_35px_rgba(var(--color-primary),0.2)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-mono text-xs font-bold tracking-widest uppercase text-primary">
                    PENDING ENGINEER AUTHORIZATION // SOPHIE AI PROPOSAL
                  </span>
                  <Badge
                    className={cn(
                      "font-mono text-xs font-bold uppercase",
                      pendingAiPrediction.alert_level === "RED"
                        ? "bg-red-600 text-white animate-pulse"
                        : pendingAiPrediction.alert_level === "YELLOW"
                          ? "bg-amber-500 text-black"
                          : "bg-emerald-600 text-white"
                    )}
                  >
                    {pendingAiPrediction.alert_level ?? "CALL PROPOSED"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-baseline gap-4">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {pendingAiPrediction.action}
                  </span>

                  {pendingAiPrediction.target_compound && (
                    <Badge
                      variant="outline"
                      className="border-primary/50 bg-primary/10 font-mono text-sm font-bold text-primary px-3 py-1"
                    >
                      FIT: {pendingAiPrediction.target_compound}
                    </Badge>
                  )}

                  {pendingAiPrediction.remaining_life !== undefined && (
                    <span className="font-mono text-xs text-muted-foreground">
                      Remaining Life: {pendingAiPrediction.remaining_life} Laps
                    </span>
                  )}
                </div>

                <p className="max-w-3xl font-mono text-sm text-zinc-300">
                  {pendingAiPrediction.reasoning}
                </p>
              </div>

              {/* TWO DECISION BUTTONS */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={isDispatching}
                  onClick={handleExecuteStrategy}
                  className="h-14 gap-2 bg-emerald-600 px-6 font-mono text-sm font-bold uppercase hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                >
                  {isDispatching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {isDispatching ? "Broadcasting..." : "Authorize & Execute"}
                </Button>

                <Button
                  disabled={isDispatching}
                  variant="outline"
                  onClick={handleRejectStrategy}
                  className="h-14 gap-2 border-red-500/40 bg-red-950/20 px-6 font-mono text-sm font-bold uppercase text-red-400 hover:bg-red-900/40 hover:text-white"
                >
                  <XCircle className="h-5 w-5" />
                  Reject Call
                </Button>
              </div>
            </div>
          </section>
        )}

        <InitialStartegy
          driver={effectiveDriver}
          circuit={effectiveCircuit}
          defaultLaps={activeSequence?.defaultLapCount ?? totalLaps}
        />

        {/* TELEMETRY & AI STRATEGY SPLIT PANEL */}
        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] *:min-w-0">
          <TelemetryDisplay
            currentLap={currentLap}
            totalLaps={activeSequence?.defaultLapCount ?? totalLaps}
            trackTemp={trackTemp}
            recentLapTimes={recentLapTimes}
            liveTelemetryData={liveTelemetryData}
            predictedPaceVector={predictedPaceVector}
          />
          <AiStrategyPanel
            key={`${effectiveDriver?.id ?? "driver"}-${effectiveCircuit?.id ?? "circuit"}-${activeSequence?.defaultLapCount ?? totalLaps}`}
            payloadRef={payloadRef}
            driverId={effectiveDriver?.acronym ?? effectiveDriver?.id}
            driverName={
              effectiveDriver?.broadcastName ?? effectiveDriver?.fullName
            }
            trackId={effectiveCircuit?.name}
            currentLap={currentLap}
            totalLaps={activeSequence?.defaultLapCount ?? totalLaps}
            currentCompound={
              activeSequence?.selectedCompounds?.[0] ?? currentCompound
            }
            tyreAge={tyreAge}
            trackStatus={trackStatus}
            trackTemp={trackTemp}
            fuelLoad={fuelLoad}
            recentLapTimes={recentLapTimes}
            predictedPaceVector={predictedPaceVector}
            onPrediction={(result) => {
              // Update pace vector for charts
              setPredictedPaceVector(result.predicted_pace_vector ?? [])
              // Stage prediction for review without sending it directly to pit crew yet
              setPendingAiPrediction(result)
              toast.info("New strategy recommendation received", {
                description: `Action: ${result.action} — Review and Authorize above.`,
              })
            }}
          />
        </section>

        <MultiStopPlanner payloadRef={payloadRef} />

        {/* PIT STOP HISTORY & RACE STATE */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock3 className="h-5 w-5 text-primary" />
                Pit Stop History
              </CardTitle>
              <CardDescription>
                Previous stop calls and strategic reasons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pitHistory.map((stop, idx) => (
                <div
                  key={`${stop.lap}-${stop.action}-${idx}`}
                  className="rounded-xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-heading text-sm font-semibold tracking-wide uppercase">
                        Lap {stop.lap}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {stop.action}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 text-[0.6rem]"
                    >
                      {stop.duration}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {stop.note}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Waves className="h-5 w-5 text-primary" />
                Race State
              </CardTitle>
              <CardDescription>
                Live operating snapshot for the selected driver.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Session
                  </div>
                  <div className="mt-2 font-heading text-xl font-semibold tracking-wide uppercase">
                    {session}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Car
                  </div>
                  <div className="mt-2 truncate font-heading text-xl font-semibold tracking-wide uppercase">
                    {effectiveCar?.name ?? "Unassigned"}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Track
                  </div>
                  <div className="mt-2 font-heading text-xl font-semibold tracking-wide uppercase">
                    {trackStatus}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Tire Age
                  </div>
                  <div className="mt-2 font-heading text-xl font-semibold tracking-wide uppercase">
                    {tireAge} Laps
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Communication & Decision
                </div>
                <p className="mt-2 text-sm text-foreground">
                  Status:{" "}
                  <span className="font-mono font-bold text-primary">
                    {decision}
                  </span>{" "}
                  — {decisionMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}