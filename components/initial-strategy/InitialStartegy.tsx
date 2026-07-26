"use client"

import { useState } from "react"
// --- CHANGE: Added ChevronRight, Sliders, and Flame icons for improved visual indicators
import { BrainCircuit, Clock3, Loader2, Sparkles, Trophy, ChevronRight, Sliders, Flame } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Option = { id?: string; name?: string; fullName?: string; broadcastName?: string; acronym?: string }
type Stint = { compound: string; laps: number }
type InitialPlan = {
  strategy_name?: string
  total_race_time?: number
  pit_stops?: number
  success_rate?: number
  stints?: Stint[]
  explanations?: string[]
}

type Props = { driver?: Option; circuit?: Option; defaultLaps?: number }

const API_URL = process.env.NEXT_PUBLIC_STRATEGY_API_URL ?? "http://localhost:8000"

// --- CHANGE: Enhanced compound colors with clear contrast & font weight
const compoundTone: Record<string, string> = {
  soft: "bg-red-500 text-white font-mono font-bold",
  medium: "bg-amber-400 text-slate-950 font-mono font-bold",
  hard: "bg-slate-100 text-slate-950 font-mono font-bold",
  wet: "bg-cyan-500 text-slate-950 font-mono font-bold",
  inters: "bg-green-500 text-slate-950 font-mono font-bold",
}

function formatTime(seconds = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m ${(seconds % 60).toFixed(1)}s`
}

export default function InitialStartegy({ driver, circuit, defaultLaps = 58 }: Props) {
  const [laps, setLaps] = useState(defaultLaps)
  const [trackTemp, setTrackTemp] = useState(35)
  const [gridPosition, setGridPosition] = useState(1)
  const [plans, setPlans] = useState<InitialPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const driverId = driver?.acronym ?? driver?.id ?? "VER"
  const driverLabel = driver?.broadcastName ?? driver?.fullName ?? driver?.name ?? driverId
  const circuitId = circuit?.id ?? circuit?.name ?? "SPA"
  const circuitLabel = circuit?.name ?? circuitId

  async function generatePlan() {
    setLoading(true)
    setError("")
    setPlans([])

    try {
      const response = await fetch(`${API_URL}/plan_initial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          track_id: circuitId,
          total_laps: laps,
          track_temp: trackTemp,
          air_temp: 25,
          starting_grid_pos: gridPosition,
        }),
      })

      if (!response.ok) throw new Error(`Strategy service returned ${response.status}.`)
      const result = await response.json()
      setPlans(Array.isArray(result) ? result : result.plans ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate a pre-race strategy.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      {/* 
        ========================================================================
        --- CHANGE 1: PIT-WALL COMPACT ACTION BAR TRIGGER ---
        Replaced full-width oversized card with a sleek, high-density telemetry bar
        that matches the F1 Pit Wall UI aesthetic without wasting vertical space.
        ========================================================================
      */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/50">
        {/* Subtle background ambient glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/70" />

        <div className="relative flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          {/* Left: Component Title & Status Badge */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-bold tracking-wider text-slate-100 uppercase">
                  Pre-Race Strategy Lab
                </h2>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 px-2 py-0 font-mono text-[10px] tracking-widest text-primary">
                  SIMULATION
                </Badge>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                Generate strategic baselines & pit-window simulations before live calls.
              </p>
            </div>
          </div>

          {/* 
            ========================================================================
            --- CHANGE 2: QUICK SESSION METADATA PILLS ---
            Fills the bar with real-time pre-race parameters so it looks functional and full
            ========================================================================
          */}
          <div className="hidden xl:flex items-center gap-5 border-x border-white/10 px-6 py-1 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Target Laps</span>
              <span className="font-bold text-slate-200">{defaultLaps} LAPS</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Active Pilot</span>
              <span className="font-bold text-primary">{driverLabel}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Circuit</span>
              <span className="font-bold text-foreground">{circuitLabel}</span>
            </div>
          </div>

          {/* 
            ========================================================================
            --- CHANGE 3: LAUNCH DIALOG TRIGGER BUTTON ---
            Explicit button replacing whole-card trigger for cleaner UX
            ========================================================================
          */}
          <DialogTrigger
            render={
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary uppercase transition-all hover:border-primary hover:bg-primary/20 hover:text-foreground"
              />
            }
          >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Launch Strategy Lab</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
          </DialogTrigger>
        </div>
      </div>

      {/* 
        ========================================================================
        --- CHANGE 4: DIALOG CONTENT STYLING & STRUCTURE ---
        Enhanced dark theme modal dialog layout with clear cyber-motorsport styling
        ========================================================================
      */}
      <DialogContent className="flex h-[min(88vh,900px)] max-h-[900px] w-[96vw] max-w-[1400px] flex-col overflow-hidden border-border/60 bg-card p-0 text-foreground sm:max-w-[1400px]">
        <DialogHeader className="border-b border-border/60 bg-muted/20 px-6 py-4 pr-14">
          <div className="flex items-center gap-2">
            <DialogTitle className="flex items-center gap-2 font-heading text-lg tracking-wide uppercase">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Pre-Race Strategy Lab
            </DialogTitle>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">
              ASTRIX STRATEGY ENGINE
            </Badge>
          </div>
          <DialogDescription className="font-mono text-xs text-slate-400">
            Configure session conditions and run simulations to evaluate optimal stint lengths and tyre strategies.
          </DialogDescription>
        </DialogHeader>

        <CardContent className="grid min-h-0 flex-1 gap-5 overflow-y-auto overflow-x-hidden p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
          {/* Sidebar: Simulation Parameters */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 font-mono">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <Sliders className="h-3.5 w-3.5" /> Simulation Controls
              </div>
              <div className="space-y-1">
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Driver</p>
                <p className="text-sm font-semibold text-slate-200">{driverLabel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Circuit</p>
                <p className="text-sm font-semibold text-amber-400">{circuitLabel}</p>
              </div>
              <Field label="Race Laps" value={laps} onChange={setLaps} min={1} />
              <Field label="Track Temp (°C)" value={trackTemp} onChange={setTrackTemp} min={-20} />
              <Field label="Grid Position" value={gridPosition} onChange={setGridPosition} min={1} max={20} />
            </div>

            <div className="space-y-2 pt-2">
              <Button onClick={generatePlan} disabled={loading} className="w-full gap-2 bg-primary font-mono text-xs font-bold text-primary-foreground uppercase hover:bg-primary/90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Simulating..." : "Generate Strategy Plans"}
              </Button>
              {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
            </div>
          </div>

          {/* Results Area */}
          <div className="min-w-0 space-y-4 lg:overflow-y-auto lg:pr-2">
            {!loading && plans.length === 0 && !error && <EmptyState />}
            {loading && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-10 text-center text-sm font-mono text-cyan-200">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-400" />
                Simulating stint degradation, track position, and optimal pit stop windows...
              </div>
            )}
            {plans.map((plan, index) => (
              <PlanCard key={`${plan.strategy_name ?? "plan"}-${index}`} plan={plan} featured={index === 0} />
            ))}
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-9 border-white/10 bg-black/40 font-mono text-xs focus:border-cyan-400/50"
      />
    </label>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center font-mono">
      <Trophy className="mb-3 h-8 w-8 text-amber-400/80" />
      <p className="font-heading text-base font-bold text-slate-200 uppercase">No Strategy Baseline Generated</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Adjust race parameters on the left sidebar and click &quot;Generate Strategy Plans&quot; to run simulations.
      </p>
    </div>
  )
}

// --- CHANGE 5: REFINED PLAN CARD DESIGN ---
function PlanCard({ plan, featured }: { plan: InitialPlan; featured: boolean }) {
  const stints = plan.stints ?? []
  const totalLaps = stints.reduce((sum, stint) => sum + stint.laps, 0) || 1
  const success = Math.round((plan.success_rate ?? 0) * 100)
  
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 transition-all ${featured ? "border-cyan-400/60 shadow-lg shadow-cyan-950/30" : "border-white/10"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-100 uppercase">
            {plan.strategy_name ?? "Strategy option"}
            {featured && (
              <Badge className="bg-amber-400 font-mono text-[10px] text-slate-950">
                <Trophy className="mr-1 h-3 w-3" /> Recommended
              </Badge>
            )}
          </h3>
          <p className="mt-1 font-mono text-xs font-semibold text-emerald-400">
            SUCCESS PROBABILITY: {success}%
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-cyan-400/30 font-mono text-xs text-cyan-200">
          <Clock3 className="h-3 w-3" /> {formatTime(plan.total_race_time)}
        </Badge>
      </div>

      {/* Visual Stint Bar */}
      <div className="mt-4 flex h-7 overflow-hidden rounded-md border border-white/10">
        {stints.map((stint, index) => (
          <div
            key={`${stint.compound}-${index}`}
            className={`flex items-center justify-center text-[10px] uppercase transition-opacity hover:opacity-90 ${compoundTone[stint.compound.toLowerCase()] ?? "bg-slate-600 text-white"}`}
            style={{ width: `${(stint.laps / totalLaps) * 100}%` }}
            title={`${stint.compound}: ${stint.laps} Laps`}
          >
            {stint.compound} ({stint.laps}L)
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-xs text-muted-foreground">
        Expected {plan.pit_stops ?? Math.max(stints.length - 1, 0)} pit stop{(plan.pit_stops ?? 0) === 1 ? "" : "s"}. Optimized across {stints.length} stint phases.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {stints.map((stint, index) => (
          <div key={`${stint.compound}-detail-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-2 text-center font-mono">
            <span className="block text-[9px] text-muted-foreground uppercase">Stint {index + 1} ({stint.compound})</span>
            <strong className="text-xs text-slate-200">{stint.laps} Laps</strong>
          </div>
        ))}
      </div>

      {!!plan.explanations?.length && (
        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3 font-mono">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
            <Flame className="h-3 w-3" /> Strategist Analysis
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
            {plan.explanations.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
