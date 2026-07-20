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
import { useGetActiveSequence } from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import { useGetCircuits, useGetDrivers, useGetCars } from "@/api/endpoints/asset-controller/asset-controller"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type SessionType = "Practice 1" | "Practice 2" | "Qualifying" | "Race"
type StrategyMode = "Management" | "Normal" | "Push"
type TrackStatus = "Green Flag" | "VSC" | "Safety Car"
type StrategyDecision = "Pending" | "Approved" | "Rejected"
type NavName = "Pit Wall" | "Dashboard" | "Race Seq" | "Strategy Matrix" | "Weather Radar" | "Car Vitals" | "Asset Management" | "Settings"

const SESSION_OPTIONS: SessionType[] = ["Practice 1", "Practice 2", "Qualifying", "Race"]
const STRATEGY_MODES: StrategyMode[] = ["Management", "Normal", "Push"]
const TRACK_STATUSES: TrackStatus[] = ["Green Flag", "VSC", "Safety Car"]

const telemetryData = Array.from({ length: 28 }).map((_, index) => ({
  lap: index + 1,
  speed: 170 + Math.sin(index / 2) * 24 + (index % 5) * 3,
  throttle: 55 + Math.cos(index / 3) * 18 + (index % 4) * 2,
}))

const pitHistory = [
  { lap: 9, action: "Soft -> Medium", duration: "2.4s", note: "Undercut secured" },
  { lap: 23, action: "Medium -> Hard", duration: "2.7s", note: "Defend position" },
  { lap: 41, action: "Fuel delta adjustment", duration: "1.1s", note: "Under VSC" },
]

const recentLapTimes = ["1:18.423", "1:18.217", "1:18.588", "1:18.092", "1:18.301"]

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
  const [engineNotes, setEngineNotes] = useState("SOPHIE and ASTRIX recommend an undercut window in the next 3 laps.")
  const [decision, setDecision] = useState<StrategyDecision>("Pending")
  const [decisionMessage, setDecisionMessage] = useState("Awaiting engineer review.")

  const router = useRouter()

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
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
    () => drivers.find((driver) => driver.id === activeSequence?.driverId) ?? drivers[0],
    [activeSequence?.driverId, drivers]
  )
  const effectiveCircuit = useMemo(
    () => circuits.find((circuit) => circuit.id === activeSequence?.circuitId) ?? circuits[0],
    [activeSequence?.circuitId, circuits]
  )
  const effectiveCar = useMemo(
    () => cars.find((car) => car.id === activeSequence?.carId) ?? cars[0],
    [activeSequence?.carId, cars]
  )

  const navItems: { name: NavName; icon: ElementType; href?: string }[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Race Seq", icon: Flag, href: "/admin/dashboard/race-sequence" },
    { name: "Pit Wall", icon: RadioTower },
    { name: "Strategy Matrix", icon: BrainCircuit },
    { name: "Weather Radar", icon: Map },
    { name: "Car Vitals", icon: Car },
    { name: "Asset Management", icon: Package, href: "/admin/dashboard/assets" },
    { name: "Settings", icon: Settings },
  ]

  const aiRecommendation = useMemo(() => {
    const modeText = strategyMode === "Push" ? "attack now" : strategyMode === "Management" ? "protect tires" : "hold position"

    return [
      `Session: ${session}`,
      `Driver: ${effectiveDriver?.broadcastName ?? effectiveDriver?.fullName ?? "No driver selected"}`,
      `Circuit: ${effectiveCircuit?.name ?? "No circuit selected"}`,
      `Car: ${effectiveCar?.name ?? "No car selected"}`,
      `Primary call: ${modeText}`,
    ]
  }, [effectiveCar?.name, effectiveCircuit?.name, effectiveDriver?.broadcastName, effectiveDriver?.fullName, session, strategyMode])

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
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 pr-6 border-r border-border/50 hover:opacity-80 transition-opacity">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 font-quicksand text-xs font-semibold uppercase tracking-widest">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => (item.href ? router.push(item.href) : setNavActive(item.name))}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  navActive === item.name ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              PIT WALL: LIVE
            </div>
            <div className="px-3 py-1.5 rounded bg-muted/50 border border-border text-muted-foreground">
              S: {session} | ST: {strategyMode}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExit} className="font-quicksand gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </header>

      {navActive === "Settings" ? (
        <TeamSetup onBack={() => setNavActive("Pit Wall")} />
      ) : (
        <main className="relative flex-1 overflow-auto bg-linear-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-8 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-8 top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1600px] space-y-6 p-6">
            <section className="grid gap-4 rounded-2xl border border-border/60 bg-linear-to-r from-primary/15 via-background to-cyan-500/10 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.6)] lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-primary/30 bg-primary/10 text-primary">Pit Wall Dashboard</Badge>
                  <Badge variant="outline" className={cn("rounded-full", getStatusTone(trackStatus))}>
                    {trackStatus}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                    {session}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="font-heading text-4xl font-bold uppercase tracking-tight sm:text-5xl">
                    Manage pit stop operations and real-time race communication
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Each engineer controls a driver-specific strategy lane, while the chief engineer can monitor both sides and focus the call when the race state changes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2 bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Load AI Strategy
                  </Button>
                  <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                    <RadioTower className="h-4 w-4" />
                    Live Comms
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => router.push("/admin/dashboard/race-sequence")}
                  >
                    <Flag className="h-4 w-4" />
                    Back to Race Seq
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Active Driver", value: effectiveDriver?.broadcastName ?? effectiveDriver?.fullName ?? "Unassigned", icon: Users },
                  { label: "Circuit", value: effectiveCircuit?.name ?? "Unknown circuit", icon: Map },
                  { label: "Car", value: effectiveCar?.name ?? "Unknown car", icon: Car },
                  { label: "Fuel Load", value: `${fuelLoad}%`, icon: Fuel },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <stat.icon className="h-4 w-4 text-primary" />
                      {stat.label}
                    </div>
                    <p className="mt-3 font-mono text-lg font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.95fr]">
              <Card className="border-border/60 bg-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-5 w-5 text-primary" />
                        Live Telemetry
                      </CardTitle>
                      <CardDescription>Telemetry from the selected car and circuit.</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/30 text-primary">LIVE</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-70 rounded-xl border border-border/60 bg-background/60 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetryData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pitSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="lap" stroke="rgba(255,255,255,0.25)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'monospace' }} />
                        <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                          itemStyle={{ color: 'white', fontFamily: 'monospace' }}
                          labelStyle={{ color: 'white' }}
                        />
                        <Area type="monotone" dataKey="speed" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#pitSpeed)" />
                        <Area type="monotone" dataKey="throttle" stroke="#22d3ee" strokeWidth={1.5} fillOpacity={0.15} fill="#22d3ee" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Current Lap
                      </div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="font-heading text-3xl font-bold">{currentLap}</span>
                        <span className="pb-1 text-sm text-muted-foreground">/ {totalLaps}</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <Wind className="h-4 w-4 text-primary" />
                        Track Temp
                      </div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="font-heading text-3xl font-bold">{trackTemp}</span>
                        <span className="pb-1 text-sm text-muted-foreground">°C</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {recentLapTimes.map((lapTime, index) => (
                      <div key={lapTime} className="rounded-xl border border-border/60 bg-background/70 p-3 text-center">
                        <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">Lap {index + 1}</div>
                        <div className="mt-2 font-mono text-sm font-semibold">{lapTime}</div>
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
                  <CardDescription>Configure the pit wall inputs in real time.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Session</div>
                    <div className="grid grid-cols-2 gap-2">
                      {SESSION_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSession(option)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-semibold uppercase tracking-widest transition-all",
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
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Strategy Mode</div>
                    <div className="grid grid-cols-3 gap-2">
                      {STRATEGY_MODES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setStrategyMode(option)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-semibold uppercase tracking-widest transition-all bg-linear-to-br",
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
                    <Input value={currentLap} onChange={(event) => setCurrentLap(Number(event.target.value) || 0)} type="number" className="h-10 bg-muted/40 border-border/50 font-mono" placeholder="Current Lap" />
                    <Input value={totalLaps} onChange={(event) => setTotalLaps(Number(event.target.value) || 0)} type="number" className="h-10 bg-muted/40 border-border/50 font-mono" placeholder="Total Laps" />
                    <Input value={compoundChange} onChange={(event) => setCompoundChange(event.target.value)} className="h-10 bg-muted/40 border-border/50" placeholder="Compound change" />
                    <Input value={tireAge} onChange={(event) => setTireAge(Number(event.target.value) || 0)} type="number" className="h-10 bg-muted/40 border-border/50 font-mono" placeholder="Tire Age" />
                    <Input value={fuelLoad} onChange={(event) => setFuelLoad(Number(event.target.value) || 0)} type="number" className="h-10 bg-muted/40 border-border/50 font-mono" placeholder="Fuel Load" />
                    <Input value={trackTemp} onChange={(event) => setTrackTemp(Number(event.target.value) || 0)} type="number" className="h-10 bg-muted/40 border-border/50 font-mono" placeholder="Track Temp" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Track Status</div>
                    <div className="grid grid-cols-3 gap-2">
                      {TRACK_STATUSES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTrackStatus(option)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-semibold uppercase tracking-widest transition-all",
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
                  <CardDescription>AI generated pit wall recommendations and race communication.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-linear-to-br from-primary/10 via-cyan-500/10 to-transparent p-4">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</div>
                    <div className="mt-2 space-y-1">
                      {aiRecommendation.map((line) => (
                        <p key={line} className="font-mono text-sm text-foreground">{line}</p>
                      ))}
                    </div>
                  </div>

                  <Textarea value={engineNotes} onChange={(event) => setEngineNotes(event.target.value)} className="min-h-28 bg-muted/40 border-border/50" placeholder="Pit wall notes" />

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleDecision("Approved")} className="gap-2 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-500/90 hover:to-green-500/90 shadow-lg shadow-emerald-500/20">
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => handleDecision("Rejected")} className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <ThumbsDown className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                      <CheckCircle2 className="h-4 w-4" />
                      Save Log
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision</div>
                        <p className="mt-1 font-heading text-xl font-semibold uppercase tracking-wide">{decision}</p>
                      </div>
                      <Badge className={cn("rounded-full border px-3 py-1 text-[0.65rem]", decision === "Approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : decision === "Rejected" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-border/60 bg-muted/20 text-muted-foreground")}>
                        {decisionMessage}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card className="border-border/60 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock3 className="h-5 w-5 text-primary" />
                    Pit Stop History
                  </CardTitle>
                  <CardDescription>Previous stop calls and strategic reasons.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pitHistory.map((stop) => (
                    <div key={`${stop.lap}-${stop.action}`} className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-heading text-sm font-semibold uppercase tracking-wide">Lap {stop.lap}</p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">{stop.action}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-border/60 text-[0.6rem]">{stop.duration}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{stop.note}</p>
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
                  <CardDescription>Live operating snapshot for the selected driver.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Session</div>
                      <div className="mt-2 font-heading text-xl font-semibold uppercase tracking-wide">{session}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Car</div>
                      <div className="mt-2 font-heading text-xl font-semibold uppercase tracking-wide truncate">{effectiveCar?.name ?? "Unassigned"}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Track</div>
                      <div className="mt-2 font-heading text-xl font-semibold uppercase tracking-wide">{trackStatus}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tire Age</div>
                      <div className="mt-2 font-heading text-xl font-semibold uppercase tracking-wide">{tireAge} Laps</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-linear-to-r from-primary/10 via-cyan-500/10 to-amber-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Communication
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      Chief engineer can monitor both drivers, while the pit wall focuses on the selected car and the current race state.
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