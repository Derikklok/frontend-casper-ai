"use client"

import { useState, type MutableRefObject } from "react"
import { Loader2, Route, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Strategy = {
  name: string
  total_time: number
  compounds?: string[]
}

type MultiStopResponse = {
  recommended_strategy: string
  total_race_time: number
  alternatives?: Strategy[]
  compounds?: string[]
  source?: "ai" | "fallback"
}

type Props = {
  /** Filled by AiStrategyPanel so both share the exact same inputs */
  payloadRef: MutableRefObject<(() => Record<string, unknown>) | null>
}

const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000"

const compoundTone: Record<string, string> = {
  SOFT: "border-red-500/40 text-red-300",
  MEDIUM: "border-yellow-500/40 text-yellow-300",
  HARD: "border-white/40 text-white",
}

function numberInput(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function createFallbackPlan(inputs: Record<string, unknown>): MultiStopResponse {
  const totalLaps = Math.max(1, Math.round(numberInput(inputs.total_laps, 58)))
  const currentLap = Math.max(
    0,
    Math.min(totalLaps, Math.round(numberInput(inputs.lap_number, 1)))
  )
  const lapsRemaining = Math.max(
    1,
    Math.round(numberInput(inputs.laps_remaining, totalLaps - currentLap))
  )
  const currentCompound =
    typeof inputs.current_compound === "string"
      ? inputs.current_compound
      : "MEDIUM"
  const lastLap = Math.max(60, numberInput(inputs.last_lap_time, 80.5))
  const tyreAge = Math.max(
    0,
    numberInput(inputs.current_tyre_laps, 0)
  )
  const pitLoss = Math.max(15, numberInput(inputs.pit_window_loss, 22))
  const availableTyres = ["HARD", "MEDIUM"]
  const candidates: Strategy[] = []

  const estimate = (stints: { laps: number; age: number }[]) =>
    stints.reduce(
      (total, stint) =>
        total +
        Math.max(0, stint.laps) *
          (lastLap + stint.age * 0.035 + Math.max(0, stint.laps - 20) * 0.025),
      0
    )

  candidates.push({
    name: `Stay Out (0-Stop) -> ${currentCompound}`,
    total_time: estimate([{ laps: lapsRemaining, age: tyreAge }]),
    compounds: [currentCompound],
  })

  for (const compound of availableTyres) {
    candidates.push({
      name: `Box Now -> ${compound}`,
      total_time:
        estimate([
          { laps: 0, age: tyreAge },
          { laps: lapsRemaining, age: 0 },
        ]) +
        pitLoss,
      compounds: [currentCompound, compound],
    })

    const extendLaps = Math.min(10, Math.max(3, Math.floor(lapsRemaining / 4)))
    candidates.push({
      name: `Extend ${extendLaps}L -> ${compound}`,
      total_time:
        estimate([
          { laps: extendLaps, age: tyreAge },
          { laps: lapsRemaining - extendLaps, age: 0 },
        ]) +
        pitLoss,
      compounds: [currentCompound, compound],
    })
  }

  if (lapsRemaining > 30) {
    const firstStint = Math.floor(lapsRemaining / 2)
    candidates.push({
      name: `Box -> HARD -> MEDIUM`,
      total_time:
        estimate([
          { laps: 0, age: tyreAge },
          { laps: firstStint, age: 0 },
          { laps: lapsRemaining - firstStint, age: 0 },
        ]) +
        pitLoss * 2,
      compounds: [currentCompound, "HARD", "MEDIUM"],
    })
  }

  candidates.sort((a, b) => a.total_time - b.total_time)
  const best = candidates[0]
  return {
    recommended_strategy: best.name,
    total_race_time: best.total_time,
    alternatives: candidates.slice(0, 5),
    source: "fallback",
  }
}

export default function MultiStopPlanner({ payloadRef }: Props) {
  const [data, setData] = useState<MultiStopResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fallbackNotice, setFallbackNotice] = useState("")

  async function runSimulation() {
    const build = payloadRef.current
    if (!build) {
      setError("Strategy inputs are not ready yet.")
      return
    }
    setLoading(true)
    setError("")
    setFallbackNotice("")
    let body: Record<string, unknown> | null = null
    try {
      const inputs = build()
      // Keep the multi-stop request aligned with the working HTML prototype.
      body = {
        ...inputs,
        available_tyres: [
          { compound: "HARD", status: "NEW", life_at_start: 0 },
          { compound: "MEDIUM", status: "NEW", life_at_start: 0 },
        ],
        race_history: [],
        fuel_load_kg: 40.0,
      }
      const res = await fetch(`${apiUrl}/plan/multi-stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let detail = ""
        try {
          const errorBody = (await res.json()) as {
            detail?: string | Array<{ msg?: string }>
          }
          detail =
            typeof errorBody.detail === "string"
              ? errorBody.detail
              : errorBody.detail
                ?.map((item) => item.msg)
                .filter(Boolean)
                .join("; ") ?? ""
        } catch {
          // Use the status message when the service does not return JSON.
        }
        throw new Error(
          detail
            ? `AI service returned ${res.status}: ${detail}`
            : `AI service returned ${res.status}`
        )
      }
      setData(await res.json())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed"
      if (body && /too many values to unpack/i.test(message)) {
        setData(createFallbackPlan(body))
        setFallbackNotice(
          "Showing a physics-based local strategy estimate."
        )
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const rows: Strategy[] = data
    ? [
        {
          name: data.recommended_strategy,
          total_time: data.total_race_time,
          compounds: data.compounds,
        },
        ...(data.alternatives ?? []),
      ]
        .filter((s, i, a) => a.findIndex((t) => t.name === s.name) === i)
        .sort((a, b) => a.total_time - b.total_time)
    : []

  const best = data?.total_race_time ?? 0

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 font-heading text-lg tracking-widest uppercase">
            <Route className="h-5 w-5 text-primary" />
            Multi-Stop Strategy Planner
          </CardTitle>
          <Button
            onClick={runSimulation}
            disabled={loading}
            className="gap-2 bg-violet-400 font-bold text-black uppercase hover:bg-violet-300"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Simulating..." : "Run Simulation"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {error && (
          <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-300">
            {error}
          </p>
        )}

        {!data && !error && (
          <p className="text-sm text-muted-foreground">
            Runs every legal stop combination from the current lap using the
            inputs in the AI Strategy panel.
          </p>
        )}

        {data && (
          <div className="space-y-4">
            {fallbackNotice && (
              <p className="rounded border border-amber-500/40 bg-amber-500/10 p-3 font-mono text-xs text-amber-200">
                {fallbackNotice}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] tracking-widest text-muted-foreground uppercase">
                    <th className="p-2">Strategy</th>
                    <th className="p-2">Total (s)</th>
                    <th className="p-2">Gap</th>
                    <th className="p-2">Stints</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const gap = s.total_time - best
                    const isBest = Math.abs(gap) < 1e-6
                    return (
                      <tr
                        key={s.name}
                        className={cn(
                          "border-b border-border/40",
                          isBest && "bg-primary/5"
                        )}
                      >
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2 font-mono">
                          {s.total_time.toFixed(1)}
                        </td>
                        <td className="p-2 font-mono">
                          {isBest ? (
                            <span className="flex items-center gap-1 font-bold text-green-400">
                              <Trophy className="h-3 w-3" /> WINNER
                            </span>
                          ) : (
                            `+${gap.toFixed(2)}s`
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {(s.compounds ?? []).map((c, i) => (
                              <Badge
                                key={`${c}-${i}`}
                                variant="outline"
                                className={cn(
                                  "font-mono text-[10px]",
                                  compoundTone[c.toUpperCase()]
                                )}
                              >
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="rounded-md border-l-2 border-violet-400 bg-violet-400/10 p-3 text-sm">
              <b>Recommendation:</b> {data.recommended_strategy}.{" "}
              {data.source === "fallback"
                ? "The estimate accounts for tyre age, stint length, pit-lane loss, and degradation."
                : "SOPHIE V6 calculates this as the fastest route to the flag, accounting for multi-stint degradation."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}