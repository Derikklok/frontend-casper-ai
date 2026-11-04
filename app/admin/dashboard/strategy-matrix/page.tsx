"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flag,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
  RefreshCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  ThermometerSun,
  Timer,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react"

import {
  type NormalizedTelemetryRecord,
  useGetNormalizedTelemetry,
} from "@/api/telemetry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Filter = "ALL" | "STAY_OUT" | "BOX_BOX"

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Race Seq", icon: Flag, href: "/admin/dashboard/race-sequence" },
  { name: "Strategy Matrix", icon: BrainCircuit, href: "/admin/dashboard/strategy-matrix" },
  { name: "Weather Radar", icon: Map },
  { name: "Car Vitals", icon: Activity },
  { name: "Asset Management", icon: Package, href: "/admin/dashboard/assets" },
  { name: "Settings", icon: Settings },
]

function formatTime(value?: string) {
  if (!value) return "--"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function actionTone(action?: string) {
  return action === "BOX_BOX"
    ? "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300"
    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
}

function alertTone(alert?: string) {
  return alert === "RED"
    ? "text-rose-600 dark:text-rose-300"
    : "text-emerald-600 dark:text-emerald-300"
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "text-primary",
}: {
  label: string
  value: string
  icon: typeof Activity
  tone?: string
}) {
  return (
    <div className="flex items-center gap-3 border-r border-border px-4 py-3 last:border-r-0">
      <div className={cn("rounded-md bg-muted p-2", tone)}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-quicksand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}

function DecisionRow({ record, active, onSelect }: { record: NormalizedTelemetryRecord; active: boolean; onSelect: () => void }) {
  const state = record.state
  const prediction = record.prediction
  const envelope = prediction?.meta?.decision_envelope

  return (
    <tr
      onClick={onSelect}
      className={cn("cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/50", active && "bg-primary/5")}
    >
      <td className="px-3 py-3 font-mono text-xs font-bold text-muted-foreground">{record.telemetry_id}</td>
      <td className="px-3 py-3 font-mono text-sm font-bold">{state?.lap_number ?? "--"}<span className="text-muted-foreground">/{state?.total_laps ?? "--"}</span></td>
      <td className="px-3 py-3 font-mono text-xs font-semibold">{state?.driver_id ?? "--"}</td>
      <td className="px-3 py-3"><Badge className={cn("rounded-md border px-2 py-0.5 text-[0.6rem]", actionTone(prediction?.action))}>{prediction?.action ?? "UNKNOWN"}</Badge></td>
      <td className="px-3 py-3 font-mono text-xs">{state?.current_compound ?? "--"}<span className="ml-1 text-muted-foreground">({state?.current_tyre_laps ?? "--"}L)</span></td>
      <td className="px-3 py-3 font-mono text-xs">{state?.position ?? "--"}</td>
      <td className="px-3 py-3 font-mono text-xs">{Math.round((envelope?.confidence ?? 0) * 100)}%</td>
      <td className={cn("px-3 py-3 font-mono text-xs font-bold", alertTone(prediction?.alert_level))}>{prediction?.alert_level ?? "--"}</td>
      <td className="px-3 py-3 text-right text-xs text-muted-foreground">{formatTime(record.created_at)}<ChevronRight className="ml-2 inline size-3.5" /></td>
    </tr>
  )
}

export default function StrategyMatrixPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("ALL")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const telemetryQuery = useGetNormalizedTelemetry()

  const records = useMemo(() => telemetryQuery.data ?? [], [telemetryQuery.data])
  const filteredRecords = useMemo(
    () => filter === "ALL" ? records : records.filter((record) => record.prediction?.action === filter),
    [filter, records]
  )
  const selected = records.find((record) => record.telemetry_id === selectedId) ?? filteredRecords[0]
  const latest = records[0]
  const boxCalls = records.filter((record) => record.prediction?.action === "BOX_BOX").length
  const confidence = latest?.prediction?.meta?.decision_envelope?.confidence ?? 0

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur-md">
        <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 border-r border-border pr-6">
          <BrainCircuit className="size-5 text-primary" />
          <span className="font-bitcount text-lg font-bold tracking-[0.18em]">CASPER<span className="text-primary">.AI</span></span>
        </button>
        <nav className="hidden items-center gap-1 font-quicksand text-xs font-semibold uppercase tracking-widest lg:flex">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => item.href && router.push(item.href)}
              disabled={!item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 transition-colors",
                item.name === "Strategy Matrix" ? "bg-primary/10 text-primary" : item.href ? "text-muted-foreground hover:bg-muted hover:text-foreground" : "cursor-not-allowed text-muted-foreground/45"
              )}
            >
              <item.icon className="size-3.5" />
              {item.name}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            SYS: ONLINE
          </div>
          <Button variant="outline" size="sm" onClick={handleExit} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
            <LogOut className="size-3.5" /> Exit
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <SlidersHorizontal className="size-4" /> Decision intelligence
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">Strategy Matrix</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A complete decision trail from the normalized telemetry stream. Review what the strategy engine saw, recommended, and why.</p>
          </div>
          <Button variant="outline" onClick={() => telemetryQuery.refetch()} disabled={telemetryQuery.isFetching} className="w-fit gap-2">
            <RefreshCcw className={cn("size-4", telemetryQuery.isFetching && "animate-spin")} /> Refresh feed
          </Button>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Telemetry events" value={String(records.length)} icon={Activity} />
          <Metric label="Latest lap" value={latest?.state?.lap_number ? `${latest.state.lap_number}/${latest.state.total_laps ?? "--"}` : "--"} icon={Timer} tone="text-cyan-600 dark:text-cyan-300" />
          <Metric label="Box calls" value={String(boxCalls)} icon={TrendingUp} tone="text-orange-600 dark:text-orange-300" />
          <Metric label="Current confidence" value={`${Math.round(confidence * 100)}%`} icon={ShieldCheck} tone="text-emerald-600 dark:text-emerald-300" />
        </div>

        {telemetryQuery.isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              Unable to load normalized telemetry. Check the telemetry service and NEXT_PUBLIC_TELEMETRY_API_URL.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <Card className="overflow-hidden rounded-lg border-border shadow-sm">
            <CardHeader className="border-b border-border bg-background/50 pb-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg"><BrainCircuit className="size-5 text-primary" /> Decision history</CardTitle>
                  <CardDescription>Newest normalized decisions appear first.</CardDescription>
                </div>
                <div className="flex gap-1 rounded-md border border-border bg-muted/40 p-1">
                  {(["ALL", "STAY_OUT", "BOX_BOX"] as Filter[]).map((value) => (
                    <button key={value} onClick={() => setFilter(value)} className={cn("rounded px-2.5 py-1.5 font-mono text-[10px] font-bold transition-colors", filter === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{value === "ALL" ? "ALL" : value.replace("_", " ")}</button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {telemetryQuery.isLoading ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Loading decision feed...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No decisions match this filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">ID</th>
                        <th className="px-3 py-2 font-semibold">Lap</th>
                        <th className="px-3 py-2 font-semibold">Driver</th>
                        <th className="px-3 py-2 font-semibold">Decision</th>
                        <th className="px-3 py-2 font-semibold">Tyre</th>
                        <th className="px-3 py-2 font-semibold">Pos</th>
                        <th className="px-3 py-2 font-semibold">Conf.</th>
                        <th className="px-3 py-2 font-semibold">Alert</th>
                        <th className="px-3 py-2 text-right font-semibold">Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <DecisionRow key={record.telemetry_id} record={record} active={selected?.telemetry_id === record.telemetry_id} onSelect={() => setSelectedId(record.telemetry_id)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border shadow-sm">
            <CardHeader className="border-b border-border bg-background/50">
              <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="size-5 text-primary" /> Decision inspector</CardTitle>
              <CardDescription>Context captured at the moment of recommendation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {selected ? <Inspector record={selected} /> : <p className="text-sm text-muted-foreground">Select a decision to inspect its context.</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Inspector({ record }: { record: NormalizedTelemetryRecord }) {
  const state = record.state
  const prediction = record.prediction
  const weather = prediction?.meta?.weather_intel
  const envelope = prediction?.meta?.decision_envelope
  const stateRows = [
    ["Driver", state?.driver_id ?? "--", Users],
    ["Track", state?.track_id ?? "--", Map],
    ["Compound", state?.current_compound ?? "--", Waves],
    ["Track status", state?.track_status ?? "--", Flag],
    ["Track temperature", state?.track_temp != null ? `${state.track_temp}°C` : "--", ThermometerSun],
    ["Lap time", state?.last_lap_time != null ? `${state.last_lap_time}s` : "--", Clock3],
    ["Laps remaining", state?.laps_remaining ?? "--", Timer],
    ["Tyre age", state?.current_tyre_laps != null ? `${state.current_tyre_laps} laps` : "--", Gauge],
    ["Position", state?.position ?? "--", TrendingUp],
    ["Fuel load", state?.fuel_load_kg != null ? `${state.fuel_load_kg} kg` : "--", Activity],
    ["Air temperature", state?.air_temp != null ? `${state.air_temp}°C` : "--", ThermometerSun],
    ["Humidity", state?.humidity != null ? `${state.humidity}%` : "--", Waves],
    ["Rainfall", state?.rainfall_intensity ?? "--", Waves],
    ["Traffic density", state?.traffic_density ?? "--", Users],
    ["Driving mode", state?.driving_mode ?? "--", SlidersHorizontal],
    ["Stint", state?.stint_number ?? "--", Flag],
    ["Pit loss", state?.pit_window_loss != null ? `${state.pit_window_loss}s` : "--", Timer],
    ["Race baseline", state?.race_baseline ?? "--", TrendingUp],
  ] as const

  return (
    <>
      <div className="rounded-md border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Recommended action</p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">{prediction?.action ?? "UNKNOWN"}</p>
          </div>
          <Badge className={cn("rounded-md border px-2 py-1", actionTone(prediction?.action))}>{prediction?.alert_level ?? "UNSET"}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{prediction?.reasoning ?? "No reasoning provided."}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stateRows.map(([label, value, Icon]) => (
          <div key={label} className="rounded-md border border-border bg-muted/30 p-3">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Decision confidence</span><span className="font-mono font-bold">{Math.round((envelope?.confidence ?? 0) * 100)}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(envelope?.confidence ?? 0) * 100}%` }} /></div>
        <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Weather regime</span><span className="font-mono font-bold">{weather?.recommended_compound ?? "SLICK"}</span></div>
        <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Risk level</span><span className={cn("font-mono font-bold", alertTone(prediction?.alert_level))}>{envelope?.risk_level ?? weather?.risk ?? "--"}</span></div>
      </div>
      <DetailSection title="Prediction output">
        <DetailRows rows={[
          ["Engine message", prediction?.message ?? "--"],
          ["Tyre stage", prediction?.tyre_stage ?? "--"],
          ["Remaining tyre life", prediction?.remaining_life != null ? `${prediction.remaining_life} laps` : "--"],
          ["Undercut probability", prediction?.undercut_probability != null ? `${Math.round(prediction.undercut_probability * 100)}%` : "--"],
          ["Envelope action", envelope?.primary_action ?? "--"],
          ["Envelope risk", envelope?.risk_level ?? "--"],
          ["Conditional branch", envelope?.conditional_branch ?? "None"],
          ["Decision reasoning", envelope?.reasoning ?? "--"],
        ]} />
      </DetailSection>
      <DetailSection title="Weather intelligence">
        <DetailRows rows={[
          ["Recommended compound", weather?.recommended_compound ?? "--"],
          ["Weather risk", weather?.risk ?? "--"],
          ["Wetness index", weather?.wetness_index ?? "--"],
          ["Crossover pressure", weather?.crossover_pressure ?? "--"],
          ["Delta gain", weather?.delta_gain ?? "--"],
          ["Drying", weather?.drying == null ? "--" : weather.drying ? "Yes" : "No"],
          ["Weather reason", weather?.reason ?? "--"],
        ]} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(weather?.regime_probs ?? {}).map(([name, value]) => (
            <div key={name} className="rounded-md border border-border bg-muted/30 p-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{name}</p>
              <p className="mt-1 font-mono text-xs font-bold">{Math.round(value * 100)}%</p>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailSection title="Projected pace vector">
        <div className="flex h-24 items-end gap-1 rounded-md border border-border bg-muted/30 p-3">
          {(prediction?.predicted_pace_vector ?? []).map((value, index, values) => {
            const min = Math.min(...values)
            const max = Math.max(...values)
            const height = max === min ? 100 : ((value - min) / (max - min)) * 80 + 20
            return <div key={`${index}-${value}`} title={`Lap ${index + 1}: ${value.toFixed(2)}s`} className="min-w-1 flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Best projected pace</span><span>{prediction?.predicted_pace_vector?.[0]?.toFixed(2) ?? "--"}s → {prediction?.predicted_pace_vector?.at(-1)?.toFixed(2) ?? "--"}s</span></div>
      </DetailSection>
    </>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function DetailRows({ rows }: { rows: Array<[string, string | number]> }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="max-w-[65%] text-right font-mono font-medium wrap-break-word">{value}</span>
        </div>
      ))}
    </div>
  )
}
