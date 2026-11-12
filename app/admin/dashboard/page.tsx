"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  RadioTower,
  SlidersHorizontal,
} from "lucide-react"

import { useGetCircuits, useGetDrivers } from "@/api/endpoints/asset-controller/asset-controller"
import { useGetActiveSequence } from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import { seedOf, trackPath, TrackGlyph } from "@/components/race-sequence-management/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function EngineerDashboard() {
  const router = useRouter()

  return (
    <main className="min-h-full bg-gradient-to-br from-background via-background to-primary/5">
      <CommandDeck onConfigure={() => router.push("/admin/dashboard/race-sequence")} />
    </main>
  )
}

function CommandDeck({ onConfigure }: { onConfigure: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<"drivers" | "circuits">("drivers")
  const seqQuery = useGetActiveSequence()
  const driversQuery = useGetDrivers()
  const circuitsQuery = useGetCircuits()

  const seq = seqQuery.data?.result
  const drivers = driversQuery.data?.result ?? []
  const circuits = circuitsQuery.data?.result ?? []
  const seqDriver = drivers.find((d) => d.id === seq?.driverId)

  const statusStyle: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    PLANNED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    COMPLETED: "bg-muted/50 text-muted-foreground border-border/40",
  }

  return (
    <section className="p-4 lg:p-6">
      <div className="mx-auto max-w-[1920px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">Race sequence management & live telemetry</p>
          </div>
          <Button onClick={onConfigure} className="gap-2" size="lg">
            <SlidersHorizontal className="h-4 w-4" />
            Configure
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {/* Active Sequence - Large Card */}
          <div className="lg:col-span-7 lg:row-span-2">
            {seqQuery.isLoading ? (
              <div className="h-full min-h-96 animate-pulse rounded-2xl border border-border/40 bg-card/50" />
            ) : !seq ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-card/30 p-8 text-center">
                <TrackGlyph seed={seedOf("empty")} className="h-24 w-32 text-muted-foreground/20" />
                <h2 className="mt-4 font-heading text-xl font-semibold">No Active Sequence</h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Set up a driver, circuit, and car to begin.
                </p>
                <Button onClick={onConfigure} className="mt-4 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Create Sequence
                </Button>
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
                <LiveStage
                  circuitName={seq.circuitName}
                  circuitId={seq.circuitId}
                  driverName={seq.driverName}
                  carName={seq.carName}
                  status={seq.status}
                  statusClass={statusStyle[seq.status ?? ""] ?? "bg-muted/50 text-muted-foreground border-border/40"}
                  driverNumber={seqDriver?.driverNumber}
                  totalLaps={seq.defaultLapCount ?? 50}
                />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 lg:col-span-5 lg:grid-cols-2">
            {seq && (
              <>
                <StatCard label="Total Laps" value={seq.defaultLapCount ?? "–"} icon="🏁" />
                <StatCard label="Weather" value={seq.weatherInfo ?? "–"} icon="🌤️" />
                <StatCard label="Driver" value={seq.driverName ?? "–"} icon="👤" />
                <StatCard label="Car" value={seq.carName ?? "–"} icon="🏎️" />
              </>
            )}
          </div>

          {/* Registry Tabs */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg">
              {/* Tab Header */}
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
                <div role="tablist" className="flex gap-2">
                  {(
                    [
                      ["drivers", "Drivers", drivers.length],
                      ["circuits", "Circuits", circuits.length],
                    ] as const
                  ).map(([id, label, count]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={tab === id}
                      onClick={() => setTab(id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        tab === id
                          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                      <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => router.push("/admin/dashboard/assets")}
                >
                  Manage
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              {/* Tab Content */}
              <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-3">
                {tab === "drivers" ? (
                  driversQuery.isLoading ? (
                    <ListSkeleton />
                  ) : drivers.length === 0 ? (
                    <Empty text="No drivers configured." />
                  ) : (
                    <div className="space-y-2">
                      {drivers.map((d) => (
                        <Row key={d.id} active={seq?.driverId === d.id}>
                          <span className="w-8 text-right font-heading text-lg font-bold tabular-nums text-primary">
                            {d.driverNumber ?? "–"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{d.fullName ?? d.broadcastName ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.acronym ?? "---"}
                              {d.countryCode ? ` • ${d.countryCode}` : ""}
                            </p>
                          </div>
                        </Row>
                      ))}
                    </div>
                  )
                ) : circuitsQuery.isLoading ? (
                  <ListSkeleton />
                ) : circuits.length === 0 ? (
                  <Empty text="No circuits configured." />
                ) : (
                  <div className="space-y-2">
                    {circuits.map((c) => (
                      <Row key={c.id} active={seq?.circuitId === c.id}>
                        <TrackGlyph seed={seedOf(c.id ?? c.name ?? "")} className="h-8 w-10 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{c.name ?? "Unknown"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.country ?? "–"}
                            {c.length ? ` • ${c.length} km` : ""}
                            {c.numberOfCorners ? ` • ${c.numberOfCorners} corners` : ""}
                          </p>
                        </div>
                      </Row>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              {seq && (
                <div className="border-t border-border/40 bg-muted/20 p-3">
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => router.push("/admin/dashboard/pit-wall")}
                  >
                    <RadioTower className="h-4 w-4" />
                    Open Pit Wall
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm hover:bg-card/80 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 truncate font-heading text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

type Telemetry = { speed: number; gear: number; throttle: number; brake: number; lap: number; sector: number; lastLap: string; trace: number[] }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const LAP_MS = 20000

function formatLap(seconds: number) {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, "0")}`
}

function useSimulatedTelemetry(seed: number, totalLaps: number) {
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const [t, setT] = useState<Telemetry>({ speed: 0, gear: 1, throttle: 0, brake: 0, lap: 1, sector: 1, lastLap: "–", trace: [] })

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const phase = (seed % 628) / 100
    const speedAt = (p: number) =>
      clamp(205 + 105 * Math.sin(2 * Math.PI * p * 4 + phase) + 35 * Math.sin(2 * Math.PI * p * 9 + phase * 2), 78, 338)
    const start = performance.now()
    const trace: number[] = []
    let lastTick = 0
    let raf = 0

    const frame = (now: number) => {
      const elapsed = now - start
      const p = (elapsed % LAP_MS) / LAP_MS
      const lapIndex = Math.floor(elapsed / LAP_MS)

      const path = pathRef.current
      const dot = dotRef.current
      if (path && dot) {
        const pt = path.getPointAtLength(p * path.getTotalLength())
        dot.setAttribute("cx", pt.x.toFixed(2))
        dot.setAttribute("cy", pt.y.toFixed(2))
      }

      if (now - lastTick > (reduce ? 1000 : 100)) {
        lastTick = now
        const speed = speedAt(p) + (Math.random() - 0.5) * 4
        const trend = speedAt(p + 0.01) - speedAt(p)
        const brake = trend < -6 ? clamp(Math.abs(trend) * 4, 30, 100) : 0
        const throttle = brake > 0 ? 0 : trend > 6 ? 100 : 72 + Math.random() * 20
        trace.push(speed)
        if (trace.length > 60) trace.shift()
        setT({
          speed: Math.round(speed),
          gear: clamp(Math.floor(speed / 42) + 1, 2, 8),
          throttle: Math.round(throttle),
          brake: Math.round(brake),
          lap: (lapIndex % Math.max(totalLaps, 1)) + 1,
          sector: Math.min(3, Math.floor(p * 3) + 1),
          lastLap: lapIndex > 0 ? formatLap(87 + (((lapIndex * 7919) % 100) / 100) * 1.4) : "–",
          trace: [...trace],
        })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [seed, totalLaps])

  return { pathRef, dotRef, t }
}

function LiveStage(props: {
  circuitName?: string | null
  circuitId?: string | null
  driverName?: string | null
  carName?: string | null
  status?: string | null
  statusClass: string
  driverNumber?: number | string | null
  totalLaps: number
}) {
  const seed = seedOf(props.circuitId ?? "empty")
  const d = trackPath(seed)
  const { pathRef, dotRef, t } = useSimulatedTelemetry(seed, props.totalLaps)
  const spark = t.trace.map((v, i) => `${((i * 100) / 59).toFixed(1)},${(30 - (v / 340) * 28).toFixed(1)}`).join(" ")

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest">Live</p>
          </div>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight">
            {props.circuitName ?? "Circuit not set"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {props.driverName ?? "Driver not set"} • {props.carName ?? "Car not set"}
          </p>
        </div>
        {props.status && (
          <Badge className={cn("rounded-lg border px-3 py-1 text-xs font-bold", props.statusClass)}>
            {props.status}
          </Badge>
        )}
      </div>

      {/* Track Visualization */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute -right-8 top-12 h-[70%] max-h-80 w-1/2 text-primary/30"
      >
        <path d={d} stroke="currentColor" strokeOpacity={0.15} strokeWidth={9} strokeLinejoin="round" />
        <path ref={pathRef} d={d} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" opacity={0.6} />
        <circle ref={dotRef} r={3} fill="currentColor" cx={-10} cy={-10} />
      </svg>

      {/* Driver Number Watermark */}
      {props.driverNumber != null && (
        <span className="pointer-events-none absolute bottom-0 right-0 font-heading text-[8rem] font-black leading-none text-foreground/5">
          {props.driverNumber}
        </span>
      )}

      {/* Telemetry Grid */}
      <div className="relative mt-auto grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
        <TelemetryBox label="Speed" value={`${t.speed} km/h`} color="text-cyan-400" />
        <TelemetryBox label="Gear" value={t.gear} color="text-amber-400" />
        <TelemetryBox label="Throttle" value={`${t.throttle}%`} color="text-green-400" />
        <TelemetryBox label="Brake" value={`${t.brake}%`} color="text-red-400" />
        <TelemetryBox label="Lap" value={`${t.lap} / ${props.totalLaps}`} color="text-blue-400" />
        <TelemetryBox label="Sector" value={t.sector} color="text-purple-400" />
        <TelemetryBox label="Last Lap" value={t.lastLap} color="text-yellow-400" />
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
          <p className="mt-1 text-sm font-bold text-green-400">Ready</p>
        </div>
      </div>

      {/* Speed Trace */}
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-4 h-10 w-full text-primary/40" aria-hidden>
        <polyline points={spark} fill="none" stroke="currentColor" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

function TelemetryBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("mt-1 font-heading text-lg font-bold", color)}>{value}</p>
    </div>
  )
}

function Row({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        active
          ? "bg-primary/15 ring-1 ring-primary/40 shadow-sm"
          : "hover:bg-muted/40"
      )}
    >
      {children}
      {active && (
        <span className="ml-auto shrink-0 rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
          Active
        </span>
      )}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border/40 px-4 py-8 text-center text-xs text-muted-foreground">
      {text}
    </p>
  )
}
