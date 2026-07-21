// components/pit-wall/TelemetryDisplay.tsx
"use client"

import { useState } from "react"
import { Activity, Clock3, Wind, Zap, BrainCircuit } from "lucide-react"
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TelemetryDisplayProps {
  currentLap: number
  totalLaps: number
  trackTemp: number
  recentLapTimes: string[]
  liveTelemetryData: any[]
  predictedPaceVector: number[] // From Python AI
}

export default function TelemetryDisplay({
  currentLap,
  totalLaps,
  trackTemp,
  recentLapTimes,
  liveTelemetryData,
  predictedPaceVector,
}: TelemetryDisplayProps) {
  const [viewMode, setViewMode] = useState<"LIVE" | "AI_PROJECTION">("LIVE")

  // Format AI array [80.5, 80.7, ...] into Recharts format [{ lap: "L45", time: 80.5 }, ...]
  const aiChartData = predictedPaceVector.map((time, index) => ({
    lap: `L${currentLap + index}`,
    time: time,
  }))

  return (
    <Card className="border-border/50 bg-black/40 backdrop-blur-md shadow-2xl flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-heading uppercase tracking-widest">
            {viewMode === "LIVE" ? (
              <><Activity className="h-5 w-5 text-primary" /> Live Telemetry</>
            ) : (
              <><BrainCircuit className="h-5 w-5 text-red-500" /> SOPHIE V6 Pace Projection</>
            )}
          </CardTitle>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-black/50 p-1 rounded-md border border-border/40">
            <button
              onClick={() => setViewMode("LIVE")}
              className={cn(
                "px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                viewMode === "LIVE" ? "bg-primary/20 text-primary border border-primary/50" : "text-muted-foreground hover:text-foreground"
              )}
            >
              [ LIVE_TRACE ]
            </button>
            <button
              onClick={() => setViewMode("AI_PROJECTION")}
              className={cn(
                "px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                viewMode === "AI_PROJECTION" ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              [ AI_VECTOR ]
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 pt-6">
        {/* Main Chart Area */}
        <div className="flex-1 min-h-[250px] rounded-md border border-border/40 bg-black/60 p-2 relative overflow-hidden">
          {viewMode === "LIVE" && <div className="absolute top-2 right-4 flex items-center gap-2 z-10"><Badge variant="outline" className="font-mono text-[10px] border-primary/50 text-primary bg-primary/10 animate-pulse">LIVE SENSOR DATA</Badge></div>}
          
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "LIVE" ? (
              <AreaChart data={liveTelemetryData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="lap" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(var(--color-primary-rgb),0.3)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="speed" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#speedGrad)" isAnimationActive={false} />
                <Area type="monotone" dataKey="throttle" stroke="#22d3ee" strokeWidth={1} fillOpacity={0.1} fill="#22d3ee" isAnimationActive={false} />
              </AreaChart>
            ) : (
              <LineChart data={aiChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="lap" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white', fontFamily: 'monospace', fontSize: '12px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="time" name="Predicted Lap Time (s)" stroke="#e10600" strokeWidth={3} dot={{ r: 2, fill: '#fff' }} activeDot={{ r: 5, fill: '#e10600', stroke: '#fff' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
          
          {/* Empty state for AI chart */}
          {viewMode === "AI_PROJECTION" && predictedPaceVector.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
               <span className="font-mono text-xs text-red-500/80 uppercase tracking-widest border border-red-500/30 px-4 py-2 bg-red-500/10 rounded-sm">
                 [ AWAITING_AI_SIMULATION_DATA ]
               </span>
             </div>
          )}
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-1 rounded-md border border-border/40 bg-black/50 p-3 shadow-inner">
            <div className="flex items-center gap-2 font-quicksand text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Clock3 className="h-3 w-3 text-primary" /> Curr Lap
            </div>
            <div className="mt-1 flex items-end gap-1">
              <span className="font-mono text-xl font-bold text-foreground">{currentLap}</span>
              <span className="font-mono text-[10px] text-muted-foreground pb-1">/ {totalLaps}</span>
            </div>
          </div>
          
          <div className="col-span-1 rounded-md border border-border/40 bg-black/50 p-3 shadow-inner">
            <div className="flex items-center gap-2 font-quicksand text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Wind className="h-3 w-3 text-amber-500" /> Trk Temp
            </div>
            <div className="mt-1 flex items-end gap-1">
              <span className="font-mono text-xl font-bold text-foreground">{trackTemp}</span>
              <span className="font-mono text-[10px] text-muted-foreground pb-1">°C</span>
            </div>
          </div>

          <div className="col-span-2 md:col-span-3 rounded-md border border-border/40 bg-black/50 p-3 shadow-inner">
            <div className="flex items-center gap-2 font-quicksand text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <Zap className="h-3 w-3 text-primary" /> Last 5 Laps
            </div>
            <div className="grid grid-cols-5 gap-2">
              {recentLapTimes.map((lapTime, index) => (
                <div key={index} className="text-center bg-black/40 border border-border/30 rounded-sm py-1 px-1">
                  <div className="font-mono text-[8px] text-muted-foreground/70 uppercase">L{currentLap - (5 - index)}</div>
                  <div className="font-mono text-[11px] font-bold text-foreground mt-0.5">{lapTime}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}