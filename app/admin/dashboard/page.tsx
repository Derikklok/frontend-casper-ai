"use client"

import { useRouter } from "next/navigation"
import { RadioTower, SlidersHorizontal } from "lucide-react"

import { useGetCircuits, useGetDrivers } from "@/api/endpoints/asset-controller/asset-controller"
import { useGetActiveSequence } from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import {
  CarCore,
  LapChart,
  LapTiming,
  Panel,
  PowerUnit,
  Radio,
  StatusStrip,
  Strategy,
  TimingTower,
  TraceCharts,
  TrackMap,
  Tyres,
  Weather,
} from "@/components/dashboard/widgets"
import { useLiveTelemetry } from "@/components/dashboard/use-live-telemetry"
import { seedOf, trackPath } from "@/components/race-sequence-management/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  PLANNED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-muted/50 text-muted-foreground border-border/40",
}

export default function EngineerDashboard() {
  const router = useRouter()
  const seqQuery = useGetActiveSequence()
  const driversQuery = useGetDrivers()
  const circuitsQuery = useGetCircuits()

  const seq = seqQuery.data?.result
  const drivers = driversQuery.data?.result ?? []
  const circuits = circuitsQuery.data?.result ?? []
  const circuit = circuits.find((c) => c.id === seq?.circuitId)
  const totalLaps = seq?.defaultLapCount ?? 50

  const seed = seedOf(seq?.circuitId ?? "empty")
  const d = trackPath(seed)

  const { pathRef, dotRef, registerCar, t } = useLiveTelemetry({
    seed,
    totalLaps,
    roster: drivers,
    driverId: seq?.driverId,
  })

  return (
    <main className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 p-3 lg:p-5">
      <div className="mx-auto max-w-[2200px] space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <p className="text-[11px] font-semibold tracking-widest text-green-400 uppercase">
                Live · {seq ? "Active sequence" : "Simulation preview"}
              </p>
              {seq?.status && (
                <Badge className={cn("rounded border px-2 py-0.5 text-[10px] font-bold", STATUS_STYLE[seq.status] ?? STATUS_STYLE.COMPLETED)}>
                  {seq.status}
                </Badge>
              )}
            </div>
            <h1 className="mt-1 truncate font-heading text-2xl font-bold tracking-tight">
              {seq?.circuitName ?? circuit?.name ?? "Strategy Command Center"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {seq ? `${seq.driverName ?? "Driver not set"} • ${seq.carName ?? "Car not set"}` : "No active sequence. Showing simulated telemetry."}
              {seq?.weatherInfo ? ` • ${seq.weatherInfo}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/admin/dashboard/pit-wall")}>
              <RadioTower className="h-4 w-4" />
              Pit Wall
            </Button>
            <Button size="sm" className="gap-2" onClick={() => router.push("/admin/dashboard/race-sequence")}>
              <SlidersHorizontal className="h-4 w-4" />
              {seq ? "Configure" : "Create Sequence"}
            </Button>
          </div>
        </div>

        <StatusStrip t={t} totalLaps={totalLaps} />

        {/* Main wall */}
        <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          {/* Left: timing tower */}
          <div className="xl:row-span-1">
            <TimingTower rows={t.tower} />
          </div>

          {/* Center */}
          <div className="min-w-0 space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <TrackMap
                d={d}
                pathRef={pathRef}
                dotRef={dotRef}
                registerCar={registerCar}
                rows={t.tower}
                circuitName={circuit?.name ?? seq?.circuitName}
                sector={t.sector}
              />
              <CarCore t={t} />
            </div>
            <TraceCharts trace={t.trace} />
            <div className="grid gap-3 lg:grid-cols-2">
              <LapTiming t={t} />
              <LapChart laps={t.laps} />
            </div>
            <Strategy t={t} />
          </div>

          {/* Right */}
          <div className="space-y-3">
            <Tyres t={t} />
            <PowerUnit t={t} />
            <Weather t={t} />
            <Radio msgs={t.radio} />
          </div>
        </div>

        {(seqQuery.isLoading || driversQuery.isLoading) && (
          <Panel title="Syncing">
            <p className="text-xs text-muted-foreground">Loading sequence and driver registry…</p>
          </Panel>
        )}
      </div>
    </main>
  )
}