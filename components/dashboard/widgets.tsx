"use client"

import type { ReactNode, RefObject } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { Fuel, Gauge, MessageSquare, Thermometer, Timer, Wind, Zap, CloudRain, Flag as FlagIcon, Users } from "lucide-react"

import { CompoundBadge, Tyre } from "@/components/race-sequence-management/visuals"
import { cn } from "@/lib/utils"
import type { Compound, LapPoint, RadioMsg, SectorState, Telemetry, TowerRow, TracePoint } from "./use-live-telemetry"

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */
const SECTOR_STYLE: Record<SectorState, string> = {
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  green: "bg-green-500/20 text-green-300 border-green-500/40",
  yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
}
const AXIS = { fontSize: 10, fill: "hsl(var(--muted-foreground, 215 15% 60%))" }

export function Panel({
  title, icon, right, className, children,
}: { title: string; icon?: ReactNode; right?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2">
        <h2 className="flex items-center gap-2 font-quicksand text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          {icon}
          {title}
        </h2>
        {right}
      </header>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  )
}

function Stat({ label, value, unit, tone }: { label: string; value: ReactNode; unit?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-mono text-base font-bold tabular-nums", tone)}>
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

function Bar({ value, tone, max = 100 }: { value: number; tone: string; max?: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
      <div className={cn("h-full rounded-full transition-[width] duration-100", tone)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

function CompoundDot({ c, size = 28 }: { c: Compound; size?: number }) {
  return <Tyre compound={c} size={size} />
}

/* ------------------------------------------------------------------ */
/* Status strip                                                        */
/* ------------------------------------------------------------------ */
export function StatusStrip({ t, totalLaps }: { t: Telemetry; totalLaps: number }) {
  const flagTone =
    t.flag === "GREEN" ? "bg-green-500/20 text-green-400 border-green-500/40"
    : t.flag === "YELLOW" ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/50 animate-pulse"
    : "bg-orange-500/20 text-orange-300 border-orange-500/40"
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Position" value={`P${t.position}`} tone="text-primary" />
      <Stat label="Lap" value={`${t.lap} / ${totalLaps}`} tone="text-blue-400" />
      <Stat label="Race Clock" value={t.clock} />
      <Stat label="Gap Ahead" value={t.gapAhead ? `+${t.gapAhead.toFixed(3)}` : "–"} unit="s" tone="text-cyan-400" />
      <Stat label="Gap Behind" value={t.gapBehind ? `+${t.gapBehind.toFixed(3)}` : "–"} unit="s" tone="text-amber-400" />
      <div className={cn("flex items-center justify-between rounded-lg border px-2.5 py-2", flagTone)}>
        <div>
          <p className="text-[10px] font-semibold tracking-wider uppercase opacity-70">Track</p>
          <p className="font-mono text-base font-bold">{t.flag}</p>
        </div>
        <FlagIcon className="h-4 w-4" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Timing tower                                                        */
/* ------------------------------------------------------------------ */
export function TimingTower({ rows }: { rows: TowerRow[] }) {
  return (
    <Panel title="Timing Tower" icon={<Users className="h-3.5 w-3.5" />} className="h-full" right={<span className="font-mono text-[10px] text-muted-foreground">{rows.length} CARS</span>}>
      <div className="-mx-1 max-h-[calc(100vh-12rem)] space-y-0.5 overflow-y-auto font-mono text-xs">
        <div className="grid grid-cols-[1.5rem_2.75rem_1fr_3.25rem_4rem] gap-1 px-1 pb-1 text-[10px] text-muted-foreground uppercase">
          <span>P</span><span>Drv</span><span className="text-right">Gap</span><span className="text-center">Tyre</span><span className="text-right">Int</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className={cn(
              "grid grid-cols-[1.5rem_2.75rem_1fr_3.25rem_4rem] items-center gap-1 rounded px-1 py-1 transition-colors",
              r.us ? "bg-primary/20 ring-1 ring-primary/50" : "hover:bg-muted/40",
            )}
          >
            <span className="font-bold tabular-nums">{r.pos}</span>
            <span className={cn("font-bold", r.us && "text-primary")}>{r.acronym}</span>
            <span className="text-right tabular-nums">{r.pos === 1 ? "LEADER" : `+${r.gap.toFixed(3)}`}</span>
            <span className="flex items-center justify-center gap-1">
              <CompoundDot c={r.compound} size={22} />
              <span className="text-[10px] text-muted-foreground">{r.age}</span>
            </span>
            <span className="text-right text-muted-foreground tabular-nums">{r.pos === 1 ? "–" : r.interval.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Track map                                                           */
/* ------------------------------------------------------------------ */
export function TrackMap({
  d, pathRef, dotRef, registerCar, rows, circuitName, sector,
}: {
  d: string
  pathRef: RefObject<SVGPathElement | null>
  dotRef: RefObject<SVGCircleElement | null>
  registerCar: (id: string) => (el: SVGCircleElement | null) => void
  rows: TowerRow[]
  circuitName?: string | null
  sector: number
}) {
  return (
    <Panel title={circuitName ?? "Circuit"} icon={<FlagIcon className="h-3.5 w-3.5" />} right={<span className="font-mono text-[10px] text-muted-foreground">SECTOR {sector}</span>} className="h-full">
      <svg viewBox="0 0 100 100" fill="none" className="mx-auto h-64 w-full max-w-sm text-primary" aria-label="Live track map">
        <path d={d} stroke="currentColor" strokeOpacity={0.12} strokeWidth={9} strokeLinejoin="round" />
        <path ref={pathRef} d={d} stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.6} strokeLinejoin="round" />
        {rows.filter((r) => !r.us).map((r) => (
          <circle key={r.id} ref={registerCar(r.id)} r={1.5} cx={-10} cy={-10} className="fill-muted-foreground/70" />
        ))}
        <circle ref={dotRef} r={3.2} cx={-10} cy={-10} fill="currentColor" className="drop-shadow-[0_0_4px_currentColor]" />
      </svg>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Car core: speed, gear, rpm, pedals, DRS                             */
/* ------------------------------------------------------------------ */
export function CarCore({ t }: { t: Telemetry }) {
  const LEDS = 15
  const lit = Math.round(((t.rpm - 6500) / 6000) * LEDS)
  return (
    <Panel title="Car Telemetry" icon={<Gauge className="h-3.5 w-3.5" />} className="h-full"
      right={
        <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] font-bold", t.drs ? "border-green-500/50 bg-green-500/20 text-green-400" : "border-border/50 text-muted-foreground")}>
          DRS {t.drs ? "OPEN" : "CLOSED"}
        </span>
      }>
      <div className="flex items-center gap-0.5" aria-label="RPM lights">
        {Array.from({ length: LEDS }, (_, i) => (
          <span key={i} className={cn("h-2 flex-1 rounded-sm transition-colors duration-75", i < lit ? (i < 5 ? "bg-green-500" : i < 10 ? "bg-red-500" : "bg-blue-400") : "bg-muted/50")} />
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-6xl leading-none font-black text-cyan-400 tabular-nums">{t.speed}</p>
          <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">km/h</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-6xl leading-none font-black text-amber-400">{t.gear}</p>
          <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">Gear</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl leading-none font-bold tabular-nums">{t.rpm.toLocaleString()}</p>
          <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">RPM</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-muted-foreground uppercase"><span>Throttle</span><span className="font-mono text-green-400">{t.throttle}%</span></div>
          <Bar value={t.throttle} tone="bg-green-500" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-muted-foreground uppercase"><span>Brake</span><span className="font-mono text-red-400">{t.brake}%</span></div>
          <Bar value={t.brake} tone="bg-red-500" />
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Trace charts                                                        */
/* ------------------------------------------------------------------ */
export function TraceCharts({ trace }: { trace: TracePoint[] }) {
  return (
    <Panel title="Live Trace · last 8s" icon={<Zap className="h-3.5 w-3.5" />}>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={trace} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="i" hide />
            <YAxis domain={[60, 350]} tick={AXIS} tickLine={false} axisLine={false} />
            <Area type="monotone" dataKey="speed" stroke="#22d3ee" strokeWidth={1.5} fill="url(#spd)" isAnimationActive={false} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 h-24">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={trace} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="i" hide />
            <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
            <Line type="stepAfter" dataKey="throttle" stroke="#22c55e" strokeWidth={1.4} dot={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="brake" stroke="#ef4444" strokeWidth={1.4} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Lap timing, sectors, lap chart                                      */
/* ------------------------------------------------------------------ */
export function LapTiming({ t }: { t: Telemetry }) {
  return (
    <Panel title="Lap Timing" icon={<Timer className="h-3.5 w-3.5" />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Current" value={t.curLap} tone="text-foreground" />
        <Stat label="Last" value={t.lastLap} tone="text-yellow-400" />
        <Stat label="Best" value={t.bestLap} tone="text-purple-400" />
        <Stat label="Delta" value={`${t.delta > 0 ? "+" : ""}${t.delta.toFixed(3)}`} tone={t.delta > 0 ? "text-red-400" : "text-green-400"} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {t.sectors.map((s, i) => (
          <div key={i} className={cn("rounded-lg border px-2.5 py-2", SECTOR_STYLE[s.state], t.sector === i + 1 && "ring-1 ring-foreground/40")}>
            <p className="text-[10px] font-semibold tracking-wider uppercase opacity-70">S{i + 1}</p>
            <p className="font-mono text-sm font-bold tabular-nums">{s.time}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function LapChart({ laps }: { laps: LapPoint[] }) {
  const times = laps.map((l) => l.time)
  const lo = times.length ? Math.floor(Math.min(...times)) - 1 : 87
  const hi = times.length ? Math.ceil(Math.max(...times)) + 1 : 93
  return (
    <Panel title="Lap Time & Pace Trend" icon={<Timer className="h-3.5 w-3.5" />}>
      <div className="h-40">
        {laps.length < 2 ? (
          <p className="flex h-full items-center justify-center text-xs text-muted-foreground">Waiting for completed laps…</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={laps} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="lap" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis domain={[lo, hi]} tick={AXIS} tickLine={false} axisLine={false} />
              <Line type="monotone" dataKey="time" stroke="#a78bfa" strokeWidth={1.4} dot={{ r: 2 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="pace" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              <ReferenceLine y={Math.min(...times)} stroke="#a855f7" strokeDasharray="2 4" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Tyres                                                               */
/* ------------------------------------------------------------------ */
const CORNERS = ["FL", "FR", "RL", "RR"]
const tempTone = (v: number) => (v > 108 ? "text-red-400" : v < 92 ? "text-blue-400" : "text-green-400")
const wearTone = (v: number) => (v > 75 ? "bg-red-500" : v > 50 ? "bg-amber-400" : "bg-green-500")

export function Tyres({ t }: { t: Telemetry }) {
  return (
    <Panel title="Tyres" icon={<Thermometer className="h-3.5 w-3.5" />}
      right={<span className="font-mono text-[10px] text-muted-foreground">{t.tyre.age} LAPS</span>}>
      <CompoundBadge
        compound={t.tyre.compound}
        size={56}
        prefix="Fitted"
        suffix={`${t.tyre.age} laps · avg ${(t.tyre.wear.reduce((a, b) => a + b, 0) / 4).toFixed(0)}% worn`}
        className="mb-2"
      />
      <div className="grid grid-cols-2 gap-2">
        {CORNERS.map((c, i) => (
          <div key={c} className="rounded-lg border border-border/40 bg-muted/20 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">{c}</span>
              <span className={cn("font-mono text-sm font-bold tabular-nums", tempTone(t.tyre.temps[i]))}>{t.tyre.temps[i]}°</span>
            </div>
            <div className="my-1.5"><Bar value={t.tyre.wear[i]} tone={wearTone(t.tyre.wear[i])} /></div>
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{t.tyre.wear[i].toFixed(0)}% worn</span>
              <span>{t.tyre.pressures[i]} psi</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {CORNERS.map((c, i) => (
          <div key={c} className="rounded border border-border/40 bg-muted/20 px-1.5 py-1 text-center">
            <p className="text-[9px] text-muted-foreground">BRK {c}</p>
            <p className={cn("font-mono text-xs font-bold tabular-nums", t.brakeTemps[i] > 800 ? "text-red-400" : "text-foreground")}>{t.brakeTemps[i]}°</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Power unit / ERS / fuel                                             */
/* ------------------------------------------------------------------ */
export function PowerUnit({ t }: { t: Telemetry }) {
  const modeTone = t.ers.mode === "DEPLOY" ? "text-green-400" : t.ers.mode === "HARVEST" ? "text-blue-400" : "text-muted-foreground"
  return (
    <Panel title="Power Unit" icon={<Zap className="h-3.5 w-3.5" />} right={<span className={cn("font-mono text-[10px] font-bold", modeTone)}>{t.ers.mode}</span>}>
      <div className="mb-1 flex justify-between text-[10px] font-semibold text-muted-foreground uppercase"><span>ERS Battery</span><span className="font-mono text-foreground">{t.ers.battery}%</span></div>
      <Bar value={t.ers.battery} tone={t.ers.battery < 20 ? "bg-red-500" : "bg-blue-500"} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Water" value={t.engine.water} unit="°C" tone={t.engine.water > 108 ? "text-red-400" : undefined} />
        <Stat label="Oil" value={t.engine.oil} unit="°C" />
        <Stat label="ICE" value={t.engine.ice} unit="°C" />
        <Stat label="Boost" value={t.engine.turbo} unit="bar" />
      </div>
      <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 p-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase"><Fuel className="h-3 w-3" />Fuel</span>
          <span className="font-mono text-sm font-bold tabular-nums">{t.fuel.kg} kg</span>
        </div>
        <div className="my-1.5"><Bar value={t.fuel.kg} tone="bg-amber-400" max={105} /></div>
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{t.fuel.perLap} kg/lap</span>
          <span className={t.fuel.target < 0 ? "text-red-400" : "text-green-400"}>target {t.fuel.target > 0 ? "+" : ""}{t.fuel.target} laps</span>
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Strategy                                                            */
/* ------------------------------------------------------------------ */
export function Strategy({ t }: { t: Telemetry }) {
  return (
    <Panel title="Strategy Matrix" icon={<Gauge className="h-3.5 w-3.5" />}
      right={
        <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] font-bold", t.pit.open ? "border-green-500/50 bg-green-500/15 text-green-400" : "border-border/50 text-muted-foreground")}>
          PIT WINDOW {t.pit.open ? "OPEN" : `L${t.pit.opens}`}
        </span>
      }>
      {t.pit.open && t.strategy[1] && (
        <CompoundBadge
          compound={t.strategy[1].next}
          size={52}
          prefix={`Pit window open · box L${t.pit.recommended}`}
          suffix="Next set to fit"
          className="mb-3 animate-pulse border-green-500/50 bg-green-500/10"
        />
      )}
      <p className="mb-2 font-mono text-[10px] text-muted-foreground">Window L{t.pit.opens}–L{t.pit.closes} · recommended L{t.pit.recommended}</p>
      <div className="space-y-2">
        {t.strategy.map((s) => (
          <div key={s.name} className="rounded-lg border border-border/40 bg-muted/20 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{s.name}</span>
              <span className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-muted-foreground">L{s.pitLap}</span>
                <CompoundDot c={s.next} size={26} />
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{s.next === "S" ? "SOFT" : s.next === "M" ? "MED" : "HARD"}</span>
                <span className={s.delta <= 0 ? "text-green-400" : "text-red-400"}>{s.delta > 0 ? "+" : ""}{s.delta.toFixed(2)}s</span>
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Bar value={s.prob} tone="bg-primary" />
              <span className="w-9 text-right font-mono text-[10px] text-muted-foreground">{s.prob}%</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Weather                                                             */
/* ------------------------------------------------------------------ */
export function Weather({ t }: { t: Telemetry }) {
  const w = t.weather
  return (
    <Panel title="Weather" icon={<CloudRain className="h-3.5 w-3.5" />}>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Air" value={w.air} unit="°C" />
        <Stat label="Track" value={w.track} unit="°C" tone="text-amber-400" />
        <Stat label="Humidity" value={w.humidity} unit="%" />
        <div className="rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Wind</p>
          <p className="flex items-center gap-1.5 font-mono text-base font-bold tabular-nums">
            <Wind className="h-3.5 w-3.5 text-muted-foreground" style={{ transform: `rotate(${w.windDir}deg)` }} />
            {w.wind}<span className="text-[10px] font-normal text-muted-foreground">km/h</span>
          </p>
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[10px] font-semibold text-muted-foreground uppercase"><span>Rain probability</span><span className="font-mono text-foreground">{w.rain}%</span></div>
        <Bar value={w.rain} tone={w.rain > 50 ? "bg-blue-500" : "bg-sky-400"} />
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Radio / race control                                                */
/* ------------------------------------------------------------------ */
const RADIO_TONE: Record<RadioMsg["level"], string> = {
  info: "border-l-primary/60",
  warn: "border-l-yellow-400",
  alert: "border-l-red-500",
}
export function Radio({ msgs }: { msgs: RadioMsg[] }) {
  return (
    <Panel title="Radio & Race Control" icon={<MessageSquare className="h-3.5 w-3.5" />}>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {msgs.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Channel quiet…</p>}
        {msgs.map((m) => (
          <div key={m.id} className={cn("rounded border-l-2 bg-muted/20 px-2 py-1.5", RADIO_TONE[m.level])}>
            <p className="font-mono text-[10px] text-muted-foreground">L{m.lap} · {m.from}</p>
            <p className="text-xs leading-snug">{m.text}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}