"use client"

import { useMemo, useState, type ReactNode } from "react"
import { BrainCircuit, Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Compound = "SOFT" | "MEDIUM" | "HARD"
type StrategyResponse = { action?: string; target_compound?: string | null; remaining_life?: number; predicted_pace_vector?: number[]; reasoning?: string; tyre_stage?: string; alert_level?: "GREEN" | "YELLOW" | "RED"; message?: string; undercut_probability?: number }
type Props = { driverId?: string; driverName?: string; trackId?: string; currentLap: number; totalLaps: number; currentCompound?: string; tyreAge: number; trackStatus: string; trackTemp: number; fuelLoad: number; recentLapTimes: string[]; predictedPaceVector: number[]; onPrediction: (result: StrategyResponse) => void }

const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000"
const controlClass = "h-10 w-full rounded-md border border-border/50 bg-muted/40 px-3 font-mono text-sm text-foreground transition-colors focus:border-amber-400/70 focus:bg-muted/60 focus:outline-none"
const toTrackStatus = (status: string) => status === "Safety Car" ? "SC" : status === "VSC" ? "VSC" : "GREEN"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>{children}</label>
}

export default function AiStrategyPanel({ driverId, driverName, trackId, currentLap: initialLap, totalLaps: initialTotalLaps, currentCompound: initialCompound, tyreAge: initialTyreAge, trackStatus: initialStatus, trackTemp: initialTemp, fuelLoad, recentLapTimes: initialLapTimes, predictedPaceVector, onPrediction }: Props) {
  const [drivingMode, setDrivingMode] = useState("NORMAL")
  const [currentLap, setCurrentLap] = useState(initialLap)
  const [totalLaps, setTotalLaps] = useState(initialTotalLaps)
  const [compound, setCompound] = useState<Compound>((initialCompound?.toUpperCase() as Compound) || "MEDIUM")
  const [tyreAge, setTyreAge] = useState(initialTyreAge)
  const [status, setStatus] = useState(() => toTrackStatus(initialStatus))
  const [temp, setTemp] = useState(initialTemp)
  const [lapTimes, setLapTimes] = useState(initialLapTimes.join(", "))
  const [raceHistory, setRaceHistory] = useState("")
  const [pitHistory, setPitHistory] = useState<{ lap: number; compound: Compound }[]>([])
  const [pitLap, setPitLap] = useState<number | "">("")
  const [pitCompound, setPitCompound] = useState<Compound>("MEDIUM")
  const [result, setResult] = useState<StrategyResponse | null>(null)
  const [briefing, setBriefing] = useState("")
  const [loading, setLoading] = useState<"predict" | "briefing" | null>(null)
  const [error, setError] = useState("")

  const usedCompounds = useMemo(() => Array.from(new Set(["SOFT", ...pitHistory.map((pit) => pit.compound), compound])), [compound, pitHistory])
  const payload = () => {
    const laps = lapTimes.split(",").map(Number).filter(Number.isFinite)
    return { driver_id: driverId ?? driverName ?? "UNKNOWN", driving_mode: drivingMode, track_id: trackId ?? "UNKNOWN", lap_number: currentLap, total_laps: totalLaps, laps_remaining: totalLaps - currentLap, current_compound: compound, current_tyre_laps: tyreAge, compounds_used_in_race: usedCompounds, pit_stop_history: pitHistory, available_tyres: ["HARD", "MEDIUM"].filter((item) => !usedCompounds.includes(item)).map((item) => ({ compound: item, status: "NEW", life_at_start: 0 })), track_status: status, track_temp: temp, race_history: raceHistory.split("\n").filter(Boolean), pit_window_loss: 22, last_lap_time: laps.at(-1) ?? 80.5, last_5_lap_times: laps, fuel_load_kg: fuelLoad }
  }
  async function callAi(path: string) {
    setError("")
    const response = await fetch(`${apiUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) })
    if (!response.ok) throw new Error(`AI service returned ${response.status}`)
    return response.json()
  }
  async function predict() { setLoading("predict"); try { const data = await callAi("/predict"); setResult(data); onPrediction(data) } catch (err) { setError(err instanceof Error ? err.message : "Prediction failed") } finally { setLoading(null) } }
  async function getBriefing() { setLoading("briefing"); try { const data = await callAi("/explain"); setBriefing(typeof data.briefing === "string" ? data.briefing : JSON.stringify(data.briefing ?? data, null, 2)) } catch (err) { setError(err instanceof Error ? err.message : "Briefing failed") } finally { setLoading(null) } }
  const addPitStop = () => { if (typeof pitLap !== "number" || pitLap < 1) return; setPitHistory((history) => [...history, { lap: pitLap, compound: pitCompound }].sort((a, b) => a.lap - b.lap)); setPitLap("") }
  const alertTone = result?.alert_level === "RED" ? "border-red-500/60 bg-red-500/10" : result?.alert_level === "YELLOW" ? "border-amber-500/60 bg-amber-500/10" : "border-emerald-500/50 bg-emerald-500/10"

  return <Card className="border-border/60 bg-card">
    <CardHeader className="border-b border-border/60 bg-muted/20 pb-3"><CardTitle className="flex items-center gap-2 text-lg font-heading uppercase tracking-widest"><BrainCircuit className="h-5 w-5 text-primary" /> AI Strategy Input</CardTitle></CardHeader>
    <CardContent className="space-y-5 pt-5">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/3 p-3 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"><div><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Driver profile</p><p className="mt-1 truncate font-mono font-semibold">{driverName ?? driverId ?? "Unassigned"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Track / event</p><p className="mt-1 truncate font-mono font-semibold text-amber-300">{trackId ?? "Unassigned"}</p></div></div>
      <div className="grid grid-cols-2 gap-3"><Field label="Strategy mode"><select value={drivingMode} onChange={(e) => setDrivingMode(e.target.value)} className={controlClass}><option>MANAGEMENT</option><option>NORMAL</option><option>PUSH</option></select></Field><Field label="Current compound"><select value={compound} onChange={(e) => setCompound(e.target.value as Compound)} className={controlClass}><option>SOFT</option><option>MEDIUM</option><option>HARD</option></select></Field><Field label="Current lap"><Input value={currentLap} onChange={(e) => setCurrentLap(Number(e.target.value))} type="number" className={controlClass} /></Field><Field label="Total race laps"><Input value={totalLaps} onChange={(e) => setTotalLaps(Number(e.target.value))} type="number" className={controlClass} /></Field><Field label="Tyre age (laps)"><Input value={tyreAge} onChange={(e) => setTyreAge(Number(e.target.value))} type="number" className={controlClass} /></Field><Field label="Track temperature (°C)"><Input value={temp} onChange={(e) => setTemp(Number(e.target.value))} type="number" className={controlClass} /></Field></div>
      <Field label="Track status"><select value={status} onChange={(e) => setStatus(e.target.value)} className={controlClass}><option value="GREEN">GREEN FLAG</option><option value="VSC">VIRTUAL SAFETY CAR</option><option value="SC">SAFETY CAR</option></select></Field>
      <Field label="Recent lap times (last 5, seconds)"><Input value={lapTimes} onChange={(e) => setLapTimes(e.target.value)} className={controlClass} /></Field>
      <div className="space-y-2"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pit stop history</p><div className="flex gap-2"><Input value={pitLap} onChange={(e) => setPitLap(e.target.value ? Number(e.target.value) : "")} type="number" placeholder="Lap" className={`${controlClass} w-20`} /><select value={pitCompound} onChange={(e) => setPitCompound(e.target.value as Compound)} className={`${controlClass} flex-1`}><option>SOFT</option><option>MEDIUM</option><option>HARD</option></select><Button type="button" onClick={addPitStop} size="icon" className="bg-cyan-500 text-black hover:bg-cyan-400"><Plus className="h-4 w-4" /></Button></div>{pitHistory.length ? <div className="flex flex-wrap gap-1">{pitHistory.map((pit, index) => <Badge key={`${pit.lap}-${index}`} variant="outline" className="gap-1 border-amber-500/30 text-amber-200">L{pit.lap} {pit.compound}<button type="button" aria-label={`Remove pit stop on lap ${pit.lap}`} onClick={() => setPitHistory((history) => history.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" /></button></Badge>)}</div> : <p className="text-xs text-muted-foreground">No pit stops recorded.</p>}</div>
      <Field label="Race event log (AI memory)"><Textarea value={raceHistory} onChange={(e) => setRaceHistory(e.target.value)} placeholder="Example: Lap 10: VSC deployed. Lap 15: rival pitted for hard tyres." className="min-h-20 rounded-md border-white/10 bg-white/3 px-3" /></Field>
      <div className="flex gap-2"><Button onClick={predict} disabled={loading !== null} className="flex-1 gap-2 bg-red-600 font-bold uppercase tracking-wide hover:bg-red-500">{loading === "predict" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze Strategy</Button><Button variant="outline" onClick={getBriefing} disabled={loading !== null} className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">{loading === "briefing" ? <Loader2 className="h-4 w-4 animate-spin" /> : "AI Briefing"}</Button></div>
      {error && <p className="rounded border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-300">{error}</p>}
      {result && <div className={cn("space-y-3 rounded-lg border p-4", alertTone)}><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current tyre status</p><p className="font-heading text-xl font-bold uppercase">{result.tyre_stage?.replaceAll("_", " ")}</p></div><Badge className="font-mono">{result.action}{result.target_compound ? ` · ${result.target_compound}` : ""}</Badge></div><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Remaining life" value={`${result.remaining_life ?? "—"} laps`} /><Metric label="Next lap" value={result.predicted_pace_vector?.[0] == null ? "—" : `${result.predicted_pace_vector[0].toFixed(3)}s`} /><Metric label="Undercut risk" value={result.undercut_probability == null ? "—" : `${(result.undercut_probability * 100).toFixed(0)}%`} /></div><p className="rounded border border-dashed border-white/10 bg-white/3 p-3 text-sm text-muted-foreground">{result.message ?? "No short status message returned."}</p><p className="text-sm leading-6">{result.reasoning}</p>{predictedPaceVector.length > 0 && <p className="font-mono text-[10px] text-cyan-200">{predictedPaceVector.length} projected laps loaded into the telemetry chart.</p>}</div>}
      {briefing && <div className="whitespace-pre-wrap rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm leading-6">{briefing}</div>}
    </CardContent>
  </Card>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-white/10 bg-white/3 p-2"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-mono text-xs font-bold">{value}</p></div> }
