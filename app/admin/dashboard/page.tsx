"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  RadioTower,
  SlidersHorizontal,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useGetCircuits, useGetDrivers } from "@/api/endpoints/asset-controller/asset-controller"
import { useGetActiveSequence } from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import { seedOf, trackPath, TrackGlyph, Tyre } from "@/components/race-sequence-management/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ------------------------------ sample data ------------------------------ */
// Deterministic so server and client render the same chart.
const telemetryData = Array.from({ length: 40 }).map((_, i) => ({
  distance: i * 50,
  speed: Math.round(180 + Math.sin(i / 3) * 60 + (i > 10 && i < 20 ? 60 : 0) - (i > 30 ? 90 : 0)),
}))

const timingData = [
  { p: 1, name: "VER", gap: "Leader", tire: "Medium" },
  { p: 2, name: "NOR", gap: "+1.243", tire: "Medium" },
  { p: 3, name: "GHO", gap: "+3.104", tire: "Soft", us: true },
  { p: 4, name: "LEC", gap: "+4.882", tire: "Hard" },
  { p: 5, name: "PIA", gap: "+5.120", tire: "Medium" },
]

/* ---------------------------------- page --------------------------------- */

export default function EngineerDashboard() {
  const router = useRouter()

  return (
    <main>
      <CommandDeck onConfigure={() => router.push("/admin/dashboard/race-sequence")} />
      <SamplePreview />
    </main>
  )
}

/* ------------------------- real, data-backed section ------------------------ */

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
    ACTIVE: "bg-green-500/15 text-green-500",
    PLANNED: "bg-yellow-500/15 text-yellow-500",
    COMPLETED: "bg-muted text-muted-foreground",
  }

  return (
    <section className="grid gap-5 p-5 lg:h-[calc(100svh-3.5rem)] lg:grid-cols-12 lg:grid-rows-1">
      {/* Active sequence */}
      <div className="relative flex min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-7 lg:min-h-0">
        {seqQuery.isLoading ? (
          <div className="flex-1 animate-pulse bg-muted/30" />
        ) : !seq ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <TrackGlyph seed={seedOf("empty")} className="h-32 w-44 text-muted-foreground/30" />
            <div>
              <h1 className="font-heading text-2xl font-semibold">No active sequence</h1>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a driver, circuit, car and tyres to open the pit wall.
              </p>
            </div>
            <Button onClick={onConfigure} className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Set up a sequence
            </Button>
          </div>
        ) : (
          <>
            <LiveStage
              circuitName={seq.circuitName}
              circuitId={seq.circuitId}
              driverName={seq.driverName}
              carName={seq.carName}
              status={seq.status}
              statusClass={statusStyle[seq.status ?? ""] ?? "bg-muted text-muted-foreground"}
              driverNumber={seqDriver?.driverNumber}
              totalLaps={seq.defaultLapCount ?? 50}
            />

            <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 sm:grid-cols-4">
              <Fact label="Laps" value={seq.defaultLapCount ?? "–"} />
              <Fact label="Forecast" value={seq.weatherInfo ?? "–"} />
              <Fact label="Driver" value={seq.driverName ?? "–"} />
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground">Tyres</p>
                <div className="mt-2 flex gap-1.5">
                  {seq.selectedCompounds?.length
                    ? seq.selectedCompounds.map((c) => <Tyre key={c} compound={c} size={26} />)
                    : "–"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/60 p-5">
              <Button size="lg" className="h-12 flex-1 gap-2 text-base" onClick={() => router.push("/admin/dashboard/pit-wall")}>
                <RadioTower className="h-5 w-5" />
                Open pit wall
              </Button>
              <Button size="lg" variant="outline" className="h-12 gap-2" onClick={onConfigure}>
                <SlidersHorizontal className="h-4 w-4" />
                Edit sequence
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Registry */}
      <div className="flex min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-5 lg:min-h-0">
        <div className="flex items-center justify-between border-b border-border/60 p-2">
          <div role="tablist" className="flex gap-1">
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
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  tab === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                <span className="rounded-full bg-background px-2 text-xs tabular-nums">{count}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => router.push("/admin/dashboard/assets")}>
            Manage
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-2">
          {tab === "drivers" ? (
            driversQuery.isLoading ? (
              <ListSkeleton />
            ) : drivers.length === 0 ? (
              <Empty text="No drivers yet. Add them under Asset Management." />
            ) : (
              drivers.map((d) => (
                <Row key={d.id} active={seq?.driverId === d.id}>
                  <span className="w-10 text-right font-heading text-2xl font-bold tabular-nums">{d.driverNumber ?? "–"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.fullName ?? d.broadcastName ?? "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.acronym ?? "---"}
                      {d.countryCode ? `, ${d.countryCode}` : ""}
                    </p>
                  </div>
                </Row>
              ))
            )
          ) : circuitsQuery.isLoading ? (
            <ListSkeleton />
          ) : circuits.length === 0 ? (
            <Empty text="No circuits yet. Add them under Asset Management." />
          ) : (
            circuits.map((c) => (
              <Row key={c.id} active={seq?.circuitId === c.id}>
                <TrackGlyph seed={seedOf(c.id ?? c.name ?? "")} className="h-10 w-12 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name ?? "Unknown"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.country ?? "–"}
                    {c.length ? `, ${c.length} km` : ""}
                    {c.numberOfCorners ? `, ${c.numberOfCorners} corners` : ""}
                  </p>
                </div>
              </Row>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------- simulated live telemetry ------------------------- */

type Telemetry = { speed: number; gear: number; throttle: number; brake: number; lap: number; sector: number; lastLap: string; trace: number[] }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const LAP_MS = 20000 // a demo lap takes 20 s so the motion is easy to read

function formatLap(seconds: number) {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, "0")}`
}

/** Drives a car marker around the circuit outline and produces a plausible telemetry stream. */
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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-primary/15 via-transparent to-transparent p-7">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Active sequence</p>
        {props.status && <Badge className={cn("rounded-md border-0", props.statusClass)}>{props.status}</Badge>}
      </div>
      <h1 className="mt-3 max-w-md font-heading text-4xl font-semibold leading-tight xl:text-5xl">
        {props.circuitName ?? "Circuit not set"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {props.driverName ?? "Driver not set"} in {props.carName ?? "car not set"}
      </p>

      {/* Track with moving car */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute -right-4 top-4 h-[80%] max-h-96 w-1/2 text-primary"
      >
        <path d={d} stroke="currentColor" strokeOpacity={0.22} strokeWidth={9} strokeLinejoin="round" />
        <path ref={pathRef} d={d} stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" />
        <circle ref={dotRef} r={3.6} fill="white" stroke="currentColor" strokeWidth={2} cx={-10} cy={-10} />
      </svg>
      {props.driverNumber != null && (
        <span className="pointer-events-none absolute bottom-2 right-6 font-heading text-[7rem] font-bold leading-none tabular-nums text-foreground/10 xl:text-[9rem]">
          {props.driverNumber}
        </span>
      )}

      {/* Telemetry readout */}
      <div className="relative mt-auto pt-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live preview, simulated data
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="font-heading text-6xl font-bold leading-none tabular-nums xl:text-7xl" aria-label={`Speed ${t.speed} kilometres per hour`}>
              {t.speed}
              <span className="ml-2 text-base font-normal text-muted-foreground">km/h</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gear</p>
            <p className="font-heading text-4xl font-bold tabular-nums">{t.gear}</p>
          </div>
          <div className="w-28 space-y-2 text-xs text-muted-foreground">
            <Meter label="Throttle" value={t.throttle} className="bg-green-500" />
            <Meter label="Brake" value={t.brake} className="bg-red-500" />
          </div>
          <div className="text-sm">
            <p className="tabular-nums">
              <span className="text-muted-foreground">Lap </span>
              {t.lap}
              <span className="text-muted-foreground"> / {props.totalLaps}</span>
            </p>
            <p className="tabular-nums">
              <span className="text-muted-foreground">Last </span>
              {t.lastLap}
            </p>
            <div className="mt-1.5 flex gap-1" aria-label={`Sector ${t.sector}`}>
              {[1, 2, 3].map((s) => (
                <span key={s} className={cn("h-1.5 w-8 rounded-full", s === t.sector ? "bg-primary" : s < t.sector ? "bg-primary/40" : "bg-muted")} />
              ))}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-5 h-12 w-full max-w-md text-primary" aria-hidden>
          <polyline points={spark} fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  )
}

function Meter({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-100", className)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Row({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50",
        active && "bg-primary/10 ring-1 ring-primary/40"
      )}
    >
      {children}
      {active && <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">In sequence</span>}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="m-2 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{text}</p>
}

/* ----------------------- sample preview (not live data) ---------------------- */

function SamplePreview() {
  return (
    <section className="border-t border-border/60 px-5 pb-10 pt-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-semibold">Pit wall preview</h2>
          <p className="text-sm text-muted-foreground">Sample data. Live telemetry is on the pit wall.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-5">
            <p className="font-heading text-lg font-semibold">Undercut window open</p>
            <p className="mt-1 text-sm text-muted-foreground">
              LEC’s tyres are dropping off. Pitting now gives a 68% chance of taking the position.
            </p>
            <dl className="mt-4 divide-y divide-border/60 text-sm">
              <PreviewRow label="Pit loss" value="21.4 s" />
              <PreviewRow label="Gap at exit" value="+1.2 s ahead of LEC" />
              <PreviewRow label="Suggested tyre" value={<Tyre compound="Hard" size={24} />} />
            </dl>
            <div className="mt-5 flex gap-3">
              <Button className="h-11 flex-[2]">Confirm box</Button>
              <Button variant="outline" className="h-11 flex-1">
                Hold
              </Button>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:col-span-4">
            <p className="font-heading text-lg font-semibold">Speed trace</p>
            <div className="mt-3 h-[210px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={210}>
                <AreaChart data={telemetryData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="distance" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis domain={[0, 350]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ display: "none" }}
                  />
                  <Area type="monotone" dataKey="speed" stroke="var(--color-primary)" strokeWidth={2} fill="url(#speedFill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card lg:col-span-3">
            <p className="border-b border-border/60 p-5 pb-4 font-heading text-lg font-semibold">Timing</p>
            <ul className="divide-y divide-border/50 text-sm">
              {timingData.map((d) => (
                <li
                  key={d.p}
                  className={cn("flex items-center gap-3 px-5 py-2.5", d.us && "bg-primary/10")}
                >
                  <span className="w-4 tabular-nums text-muted-foreground">{d.p}</span>
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{d.gap}</span>
                  <Tyre compound={d.tire} size={20} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}