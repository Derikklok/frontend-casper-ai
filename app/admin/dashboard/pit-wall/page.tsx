"use client"

import { useMemo, useState, type ElementType } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Car,
  CheckCircle2,
  Clock3,
  Flag,
  Fuel,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
  RadioTower,
  Settings,
  Sparkles,
  Timer,
  ThumbsDown,
  ThumbsUp,
  Users,
  Waves,
  Wind,
  Zap,
  CloudRain,
  Thermometer,
  Droplets,
  Wifi,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import TeamSetup from "@/components/team-management/teamSetup"
import TelemetryDisplay from "@/components/pit-wall/TelemetryDisplay"
import AiStrategyPanel from "@/components/pit-wall/AiStrategyPanel"
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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type SessionType = "Practice 1" | "Practice 2" | "Qualifying" | "Race"
type StrategyMode = "Management" | "Normal" | "Push"
type TrackStatus = "Green Flag" | "VSC" | "Safety Car"
type StrategyDecision = "Pending" | "Approved" | "Rejected"
type NavName =
  | "Pit Wall"
  | "Dashboard"
  | "Race Seq"
  | "Strategy Matrix"
  | "Weather Radar"
  | "Car Vitals"
  | "Asset Management"
  | "Settings"

const SESSION_OPTIONS: SessionType[] = [
  "Practice 1",
  "Practice 2",
  "Qualifying",
  "Race",
]
const STRATEGY_MODES: StrategyMode[] = ["Management", "Normal", "Push"]
const TRACK_STATUSES: TrackStatus[] = ["Green Flag", "VSC", "Safety Car"]

const telemetryData = Array.from({ length: 28 }).map((_, index) => ({
  lap: index + 1,
  speed: 170 + Math.sin(index / 2) * 24 + (index % 5) * 3,
  throttle: 55 + Math.cos(index / 3) * 18 + (index % 4) * 2,
}))

// Mock Live Trace Data
const liveTelemetryData = Array.from({ length: 28 }).map((_, index) => ({
  lap: index + 1,
  speed: 170 + Math.sin(index / 2) * 24 + (index % 5) * 3,
  throttle: 55 + Math.cos(index / 3) * 18 + (index % 4) * 2,
}))

const pitHistory = [
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

const recentLapTimes = [
  "1:18.423",
  "1:18.217",
  "1:18.588",
  "1:18.092",
  "1:18.301",
]

function getStatusTone(status: TrackStatus) {
  switch (status) {
    case "Green Flag":
      return "bg-green-500/10 text-green-400 border-green-500/30"
    case "VSC":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30"
    case "Safety Car":
      return "bg-red-500/10 text-red-300 border-red-500/30"
  }
}

function getModeTone(mode: StrategyMode) {
  switch (mode) {
    case "Management":
      return "from-blue-500/15 via-cyan-500/10 to-transparent text-cyan-200 border-cyan-500/30"
    case "Normal":
      return "from-primary/15 via-primary/10 to-transparent text-primary border-primary/30"
    case "Push":
      return "from-orange-500/15 via-amber-500/10 to-transparent text-amber-200 border-amber-500/30"
  }
}

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
    <div className="rounded-md border border-border/40 bg-black/50 p-3">
      <div className="font-quicksand text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-lg font-bold", color)}>{value}</div>
    </div>
  )
}

export default function PitWallPage() {
  const [navActive, setNavActive] = useState<NavName>("Pit Wall")
  const [session, setSession] = useState<SessionType>("Race")
  const [strategyMode, setStrategyMode] = useState<StrategyMode>("Normal")
  const [trackStatus, setTrackStatus] = useState<TrackStatus>("Green Flag")
  const [currentLap, setCurrentLap] = useState(16)
  const [totalLaps, setTotalLaps] = useState(58)
  const [compoundChange, setCompoundChange] = useState("Soft -> Medium")
  const [tireAge, setTireAge] = useState(11)
  const [fuelLoad, setFuelLoad] = useState(43)
  const [trackTemp, setTrackTemp] = useState(34)
  const [engineNotes, setEngineNotes] = useState(
    "SOPHIE and ASTRIX recommend an undercut window in the next 3 laps."
  )
  const [decision, setDecision] = useState<StrategyDecision>("Pending")
  const [decisionMessage, setDecisionMessage] = useState(
    "Awaiting engineer review."
  )

  const [drivingMode, setDrivingMode] = useState("NORMAL")
  const [currentCompound, setCurrentCompound] = useState("MEDIUM")
  const [tyreAge, setTyreAge] = useState(15)
  const [recentLapTimes, setRecentLapTimes] = useState([
    "80.5",
    "80.7",
    "80.9",
    "81.2",
    "81.5",
  ])
  const [raceHistoryLog, setRaceHistoryLog] = useState("")

  // AI Output State
  const [predictedPaceVector, setPredictedPaceVector] = useState<number[]>([])
  // const [aiAnalysis, setAiAnalysis] = useState<any>(null) // Will use in Part 2

  const router = useRouter()

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  // ------------------------------------------------------------------
  // Mock Live Telemetry Ribbon
  // ------------------------------------------------------------------

  const liveTelemetry = {
    session: "RACE",
    lap: 16,
    position: "P2",
    speed: 286,
    rpm: 11240,
    gear: 7,
    drs: "OPEN",
    ers: 74,
    fuel: 43,
    compound: "SOFT",
    tyreAge: 15,
    trackTemp: 34,
    airTemp: 26,
    humidity: 61,
    wind: "12 km/h",
    weather: "CLEAR",
    lastLap: "1:28.441",
  }

  const activeSequenceQuery = useGetActiveSequence()
  const driversQuery = useGetDrivers()
  const circuitsQuery = useGetCircuits()
  const carsQuery = useGetCars()

  const activeSequence = activeSequenceQuery.data?.result
  const drivers = driversQuery.data?.result ?? []
  const circuits = circuitsQuery.data?.result ?? []
  const cars = carsQuery.data?.result ?? []

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

  // const handleExit = () => {
  //   Cookies.remove("auth_token")
  //   Cookies.remove("user_details")
  //   router.push("/auth/login")
  // }

  const navItems: { name: NavName; icon: ElementType; href?: string }[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Race Seq", icon: Flag, href: "/admin/dashboard/race-sequence" },
    { name: "Pit Wall", icon: RadioTower },
    { name: "Strategy Matrix", icon: BrainCircuit },
    { name: "Weather Radar", icon: Map },
    { name: "Car Vitals", icon: Car },
    {
      name: "Asset Management",
      icon: Package,
      href: "/admin/dashboard/assets",
    },
    { name: "Settings", icon: Settings },
  ]

  const aiRecommendation = useMemo(() => {
    const modeText =
      strategyMode === "Push"
        ? "attack now"
        : strategyMode === "Management"
          ? "protect tires"
          : "hold position"

    return [
      `Session: ${session}`,
      `Driver: ${effectiveDriver?.broadcastName ?? effectiveDriver?.fullName ?? "No driver selected"}`,
      `Circuit: ${effectiveCircuit?.name ?? "No circuit selected"}`,
      `Car: ${effectiveCar?.name ?? "No car selected"}`,
      `Primary call: ${modeText}`,
    ]
  }, [
    effectiveCar?.name,
    effectiveCircuit?.name,
    effectiveDriver?.broadcastName,
    effectiveDriver?.fullName,
    session,
    strategyMode,
  ])

  const handleDecision = (nextDecision: StrategyDecision) => {
    setDecision(nextDecision)
    setDecisionMessage(
      nextDecision === "Approved"
        ? "Strategy approved and recorded in the pit wall log."
        : nextDecision === "Rejected"
          ? "Strategy rejected. Awaiting revised call from SOPHIE + ASTRIX."
          : "Strategy reset to pending review."
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 border-r border-border/50 pr-6 transition-opacity hover:opacity-80"
          >
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </button>

          <nav className="font-quicksand hidden items-center gap-1 text-xs font-semibold tracking-widest uppercase lg:flex">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() =>
                  item.href ? router.push(item.href) : setNavActive(item.name)
                }
                className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${
                  navActive === item.name
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 rounded-sm border border-border/50 bg-black/60 px-3 py-1.5 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              SOPHIE V6: ONLINE
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="font-quicksand gap-2 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      </header>

      {navActive === "Settings" ? (
        <TeamSetup onBack={() => setNavActive("Pit Wall")} />
      ) : (
        <main className="pit-wall-shell relative flex-1 overflow-auto">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />
            <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-red-500/5 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-[1600px] space-y-6 p-6">
            <section className="rounded-xl border border-border/40 bg-black/70 p-4 shadow-inner">
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

                <TelemetryItem
                  label="DRS"
                  value="OPEN"
                  color="text-green-400"
                />

                <TelemetryItem label="ERS" value="74%" color="text-cyan-400" />

                <TelemetryItem
                  label="FUEL"
                  value="43 kg"
                  color="text-green-400"
                />

                <TelemetryItem label="TYRE" value="SOFT" color="text-red-400" />

                <TelemetryItem label="TYRE AGE" value="15 Laps" />

                <TelemetryItem
                  label="TRACK"
                  value="34°C"
                  color="text-orange-400"
                />

                <TelemetryItem label="AIR" value="26°C" />

                <TelemetryItem
                  label="HUMIDITY"
                  value="61%"
                  color="text-sky-400"
                />

                <TelemetryItem label="WIND" value="12 km/h" />

                <TelemetryItem
                  label="WEATHER"
                  value="CLEAR"
                  color="text-green-400"
                />

                <TelemetryItem label="LAST LAP" value="1:28.441" />
              </div>
            </section>
            <section className="grid gap-4 rounded-xl border border-border/40 bg-black/60 p-4 shadow-inner lg:grid-cols-[1fr_auto]">
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
                        <stat.icon className={`h-4 w-4 ${stat.tone}`} />{" "}
                        {stat.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Badge className="self-center rounded-sm border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                SYS_READY
              </Badge>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
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
                driverId={effectiveDriver?.id}
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
                onPrediction={(result) =>
                  setPredictedPaceVector(result.predicted_pace_vector ?? [])
                }
              />
            </section>

            {false && (
              <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.95fr]">
                <Card className="border-border/60 bg-card/80">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Activity className="h-5 w-5 text-primary" />
                          Live Telemetry
                        </CardTitle>
                        <CardDescription>
                          Telemetry from the selected car and circuit.
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/30 text-primary"
                      >
                        LIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-70 rounded-xl border border-border/60 bg-background/60 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={telemetryData}
                          margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="pitSpeed"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.06)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="lap"
                            stroke="rgba(255,255,255,0.25)"
                            tick={{
                              fill: "rgba(255,255,255,0.45)",
                              fontSize: 10,
                              fontFamily: "monospace",
                            }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.25)"
                            tick={{
                              fill: "rgba(255,255,255,0.45)",
                              fontSize: 10,
                              fontFamily: "monospace",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "12px",
                            }}
                            itemStyle={{
                              color: "white",
                              fontFamily: "monospace",
                            }}
                            labelStyle={{ color: "white" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="speed"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#pitSpeed)"
                          />
                          <Area
                            type="monotone"
                            dataKey="throttle"
                            stroke="#22d3ee"
                            strokeWidth={1.5}
                            fillOpacity={0.15}
                            fill="#22d3ee"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                          <Clock3 className="h-4 w-4 text-primary" />
                          Current Lap
                        </div>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="font-heading text-3xl font-bold">
                            {currentLap}
                          </span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            / {totalLaps}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                          <Wind className="h-4 w-4 text-primary" />
                          Track Temp
                        </div>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="font-heading text-3xl font-bold">
                            {trackTemp}
                          </span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            °C
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {recentLapTimes.map((lapTime, index) => (
                        <div
                          key={lapTime}
                          className="rounded-xl border border-border/60 bg-background/70 p-3 text-center"
                        >
                          <div className="text-[0.6rem] font-semibold tracking-widest text-muted-foreground uppercase">
                            Lap {index + 1}
                          </div>
                          <div className="mt-2 font-mono text-sm font-semibold">
                            {lapTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Zap className="h-5 w-5 text-primary" />
                      Strategy Controls
                    </CardTitle>
                    <CardDescription>
                      Configure the pit wall inputs in real time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Session
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SESSION_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSession(option)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-semibold tracking-widest uppercase transition-all",
                              session === option
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Strategy Mode
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {STRATEGY_MODES.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setStrategyMode(option)}
                            className={cn(
                              "rounded-xl border bg-linear-to-br px-3 py-2 text-sm font-semibold tracking-widest uppercase transition-all",
                              strategyMode === option
                                ? getModeTone(option)
                                : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={currentLap}
                        onChange={(event) =>
                          setCurrentLap(Number(event.target.value) || 0)
                        }
                        type="number"
                        className="h-10 border-border/50 bg-muted/40 font-mono"
                        placeholder="Current Lap"
                      />
                      <Input
                        value={totalLaps}
                        onChange={(event) =>
                          setTotalLaps(Number(event.target.value) || 0)
                        }
                        type="number"
                        className="h-10 border-border/50 bg-muted/40 font-mono"
                        placeholder="Total Laps"
                      />
                      <Input
                        value={compoundChange}
                        onChange={(event) =>
                          setCompoundChange(event.target.value)
                        }
                        className="h-10 border-border/50 bg-muted/40"
                        placeholder="Compound change"
                      />
                      <Input
                        value={tireAge}
                        onChange={(event) =>
                          setTireAge(Number(event.target.value) || 0)
                        }
                        type="number"
                        className="h-10 border-border/50 bg-muted/40 font-mono"
                        placeholder="Tire Age"
                      />
                      <Input
                        value={fuelLoad}
                        onChange={(event) =>
                          setFuelLoad(Number(event.target.value) || 0)
                        }
                        type="number"
                        className="h-10 border-border/50 bg-muted/40 font-mono"
                        placeholder="Fuel Load"
                      />
                      <Input
                        value={trackTemp}
                        onChange={(event) =>
                          setTrackTemp(Number(event.target.value) || 0)
                        }
                        type="number"
                        className="h-10 border-border/50 bg-muted/40 font-mono"
                        placeholder="Track Temp"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Track Status
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {TRACK_STATUSES.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setTrackStatus(option)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-semibold tracking-widest uppercase transition-all",
                              trackStatus === option
                                ? getStatusTone(option)
                                : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Sparkles className="h-5 w-5 text-primary" />
                      SOPHIE + ASTRIX
                    </CardTitle>
                    <CardDescription>
                      AI generated pit wall recommendations and race
                      communication.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/60 bg-linear-to-br from-primary/10 via-cyan-500/10 to-transparent p-4">
                      <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Recommendation
                      </div>
                      <div className="mt-2 space-y-1">
                        {aiRecommendation.map((line) => (
                          <p
                            key={line}
                            className="font-mono text-sm text-foreground"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      value={engineNotes}
                      onChange={(event) => setEngineNotes(event.target.value)}
                      className="min-h-28 border-border/50 bg-muted/40"
                      placeholder="Pit wall notes"
                    />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleDecision("Approved")}
                        className="gap-2 bg-linear-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/20 hover:from-emerald-500/90 hover:to-green-500/90"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecision("Rejected")}
                        className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-primary/30 hover:bg-primary/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Save Log
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            Decision
                          </div>
                          <p className="mt-1 font-heading text-xl font-semibold tracking-wide uppercase">
                            {decision}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full border px-3 py-1 text-[0.65rem]",
                            decision === "Approved"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : decision === "Rejected"
                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                : "border-border/60 bg-muted/20 text-muted-foreground"
                          )}
                        >
                          {decisionMessage}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

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
                  {pitHistory.map((stop) => (
                    <div
                      key={`${stop.lap}-${stop.action}`}
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

                  <div className="rounded-xl border border-border/60 bg-linear-to-r from-primary/10 via-cyan-500/10 to-amber-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Communication
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      Chief engineer can monitor both drivers, while the pit
                      wall focuses on the selected car and the current race
                      state.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      )}
    </div>
  )
}
