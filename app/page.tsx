"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Car,
  Cpu,
  Flag,
  Gauge,
  Network,
  RadioTower,
  Timer,
  Zap,
  Check,
  X,
  ChevronRight,
  Flame,
  ArrowRight,
  TrendingDown,
  CloudRain,
  Play,
  RotateCcw
} from "lucide-react"
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from "recharts"
import Image from "next/image"
import Link from "next/link"

// Define types for simulation states
type SimMode = "standard" | "safety_car" | "undercut" | "monsoon"

// Generates telemetry data points based on simulation mode
const getTelemetryData = (mode: SimMode) => {
  return Array.from({ length: 30 }).map((_, i) => {
    const distance = i * 150
    let speed = 280 + Math.random() * 20
    let throttle = Math.random() > 0.1 ? 100 : Math.random() * 40
    let brakes = 0

    if (mode === "safety_car") {
      // Safety car speeds are significantly reduced (delta limit)
      speed = 90 + Math.random() * 15
      throttle = 35 + Math.random() * 15
    } else if (mode === "undercut") {
      // Degrading tires show fluctuating speed and high drag
      speed = 260 + Math.random() * 15 - (i > 15 ? 20 : 0)
      throttle = i > 15 && Math.random() > 0.5 ? 90 : 100
    } else if (mode === "monsoon") {
      // Wet track speeds drop to prevent aquaplaning
      speed = 220 + Math.random() * 15 - (i > 10 ? 30 : 0)
      throttle = 75 + Math.random() * 15
      brakes = i % 5 === 0 ? 80 : 0
    }

    return {
      distance,
      speed: Math.round(speed),
      throttle: Math.round(throttle),
      brakes
    }
  })
}

// Tire status based on simulation mode
const getTireVitals = (mode: SimMode) => {
  switch (mode) {
    case "safety_car":
      return {
        compound: "M",
        compoundColor: "bg-yellow-500 text-black",
        stint: 14,
        flWear: 62, flTemp: "85°C", flColor: "bg-blue-500/80", // Cold tires
        frWear: 58, frTemp: "82°C", frColor: "bg-blue-500/80",
        rlWear: 50, rlTemp: "88°C", rlColor: "bg-blue-500/80",
        rrWear: 48, rrTemp: "86°C", rrColor: "bg-blue-500/80",
      }
    case "undercut":
      return {
        compound: "S",
        compoundColor: "bg-red-500 text-white animate-pulse",
        stint: 22,
        flWear: 84, flTemp: "128°C", flColor: "bg-red-600 animate-pulse", // Overheated / worn
        frWear: 81, frTemp: "125°C", frColor: "bg-red-600 animate-pulse",
        rlWear: 68, rlTemp: "134°C", rlColor: "bg-red-600 animate-pulse",
        rrWear: 65, rrTemp: "132°C", rrColor: "bg-red-600 animate-pulse",
      }
    case "monsoon":
      return {
        compound: "I",
        compoundColor: "bg-green-500 text-white",
        stint: 2,
        flWear: 24, flTemp: "68°C", flColor: "bg-green-500", // Wet tires optimal
        frWear: 22, frTemp: "66°C", frColor: "bg-green-500",
        rlWear: 18, rlTemp: "70°C", rlColor: "bg-green-500",
        rrWear: 17, rrTemp: "69°C", rrColor: "bg-green-500",
      }
    case "standard":
    default:
      return {
        compound: "S",
        compoundColor: "bg-red-500 text-white",
        stint: 8,
        flWear: 38, flTemp: "105°C", flColor: "bg-green-500", // Optimal softs
        frWear: 35, frTemp: "102°C", frColor: "bg-green-500",
        rlWear: 28, rlTemp: "109°C", rlColor: "bg-green-500",
        rrWear: 26, rrTemp: "107°C", rrColor: "bg-green-500",
      }
  }
}

// AI Strategy recommendations based on simulation mode
const getStrategyRecommendation = (mode: SimMode) => {
  switch (mode) {
    case "safety_car":
      return {
        title: "SC Pit Window Active",
        urgency: "CRITICAL",
        urgencyColor: "bg-orange-500 text-black",
        description: "Safety Car deployed. Pitting now saves 12.2s in pit-lane delta over standard box conditions.",
        pitLoss: "10.4s (Net Saved: 11.2s)",
        gapExit: "+4.1s ahead of STR (P5)",
        compound: "HARD (C2)",
        actionText: "Box This Lap",
        probability: "89% Net Gain"
      }
    case "undercut":
      return {
        title: "Undercut Window Open",
        urgency: "CRITICAL",
        urgencyColor: "bg-red-600 text-white animate-pulse",
        description: "Car 4 (LEC) tires dropping rapidly. Pitting now yields an overtake opportunity on lap exit.",
        pitLoss: "21.6s",
        gapExit: "+1.2s ahead of LEC (P3)",
        compound: "HARD (C3)",
        actionText: "Confirm Box",
        probability: "78% Overtake Probability"
      }
    case "monsoon":
      return {
        title: "Heavy Rain Crossover",
        urgency: "ACTION REQ",
        urgencyColor: "bg-blue-600 text-white animate-pulse",
        description: "Track saturation in Turn 4-7 exceeding 68%. Slick crossover point reached in 2 laps.",
        pitLoss: "22.1s",
        gapExit: "+0.8s ahead of NOR (P2)",
        compound: "INTERMEDIATE (I)",
        actionText: "Box for Inters",
        probability: "94% Saturation Match"
      }
    case "standard":
    default:
      return {
        title: "Maintain Stint Plan",
        urgency: "MONITORING",
        urgencyColor: "bg-zinc-800 text-muted-foreground",
        description: "Speeds stable. Stint target is Lap 16. Monitor gap to LEC (+3.2s).",
        pitLoss: "21.4s (theoretical)",
        gapExit: "-2.4s behind LEC (P3)",
        compound: "MEDIUM (C4)",
        actionText: "Extend Stint",
        probability: "Optimal Stint Efficiency"
      }
  }
}

export default function CasperLandingPage() {
  const [simMode, setSimMode] = useState<SimMode>("standard")
  const [simMessage, setSimMessage] = useState<string | null>(null)

  // Derived state (calculated during rendering) to avoid unnecessary effects and cascading renders
  const telemetry = getTelemetryData(simMode)
  const tires = getTireVitals(simMode)
  const strategy = getStrategyRecommendation(simMode)

  const handleSimModeChange = (mode: SimMode) => {
    setSimMode(mode)
    setSimMessage(null) // Reset user action message
  }

  const handleActionClick = () => {
    if (simMode === "standard") {
      setSimMessage("Stint extended. Targets updated on Engineer HUD.")
    } else {
      setSimMessage(`Strategy Confirmed! Radio transmission sent: "BOX BOX BOX" for ${strategy.compound}.`)
    }
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-slate-100 selection:bg-red-500/20">
      
      {/* Background Neon Elements */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.08),transparent_40%),radial-gradient(circle_at_right_50%,rgba(168,85,247,0.05),transparent_35%)]" />

      {/* Global Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/75 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-red-500 animate-pulse" />
          <span className="font-bitcount text-xl font-bold tracking-[0.18em] text-white">
            CASPER<span className="text-red-500">.AI</span>
          </span>
        </div>
        <nav className="font-quicksand hidden items-center gap-8 text-xs font-semibold uppercase tracking-widest text-zinc-400 md:flex">
          <a href="#features" className="transition-colors hover:text-red-500">Features</a>
          <a href="#telemetry-sim" className="transition-colors hover:text-red-500">Live Simulator</a>
          <a href="#hitl" className="transition-colors hover:text-red-500">HITL Protocol</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <Link href="/auth/register">Start Session</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 lg:py-24">
        {/* Full screen background hero image from F1 */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/f1-hero-1.jpg"
            alt="Formula 1 Racing Background"
            fill
            className="object-cover object-center opacity-40 mix-blend-luminosity scale-100"
            priority
            sizes="100vw"
          />
          {/* Intense dark radial overlays to keep text contrast outstanding */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950/80" />
          {/* Digital telemetry scanner lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Aggressive Copy */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 lg:gap-8">
            <Badge
              variant="outline"
              className="font-quicksand rounded-full border-red-500/50 bg-red-500/10 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-red-400 uppercase"
            >
              <RadioTower className="mr-2 inline-block h-3.5 w-3.5 text-red-500 animate-pulse" />
              PIT WALL TELEMETRY CHANNEL ACTIVE
            </Badge>

            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight uppercase">
              RACE STRATEGY, <br />
              <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent italic drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
                MASTERED BY AI.
              </span>
              <br />
              COMMANDED BY YOU.
            </h1>

            <p className="font-google-flex max-w-xl text-base sm:text-lg leading-relaxed text-zinc-300">
              CASPER.AI digests dynamic F1 telemetry in real-time. Optimize stint curves, react to safety car deltas, and capture undercut windows. Run high-fidelity simulations instantly, and execute strategy with absolute control.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base bg-red-600 hover:bg-red-700 text-white font-heading tracking-widest uppercase shadow-lg shadow-red-600/35 transition-transform duration-300 hover:scale-105"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Initialize Dashboard
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-8 text-base"
              >
                <a href="#telemetry-sim" className="flex items-center gap-2">
                  Explore Simulator <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right: Floating Vitals HUD preview */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-red-500 before:to-transparent">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest">LIVE HUD FEED</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>

              {/* Mini race leader status */}
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>CAR IN FOCUS</span>
                    <span className="text-red-500 font-bold">GHO-1</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold">P3</span>
                    <span className="text-zinc-500">GAP TO P2: +1.24s</span>
                  </div>
                </div>

                {/* ERS & Speed HUD dial mock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500">SPEED</span>
                    <p className="text-xl font-bold text-white mt-1">312 <span className="text-xs text-zinc-500">KM/H</span></p>
                  </div>
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500">ERS CHARGE</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Gauge className="h-4 w-4 text-yellow-500" />
                      <span className="text-xl font-bold">84%</span>
                    </div>
                  </div>
                </div>

                {/* Strategy alert bubble */}
                <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold text-[11px] block">CRITICAL ALERT</span>
                    <span className="text-[10px] leading-snug">LEC Pit stop completed. Window active to protect track position.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulation Section */}
      <section id="telemetry-sim" className="relative border-y border-zinc-800/80 bg-zinc-950 px-6 py-20">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-500 mb-2 font-mono tracking-widest uppercase">
              Interact with the telemetry
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase">
              Pit-Wall Strategy Console
            </h2>
            <p className="font-google-flex mx-auto mt-3 max-w-2xl text-zinc-400">
              Select a track scenario below to witness how CASPER.AI dynamically digests sector speeds, updates tire degradation parameters, and suggests strategy matrix pivots in real-time.
            </p>
          </div>

          {/* Interactive Toggle Controls */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => handleSimModeChange("standard")}
              className={`px-5 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                simMode === "standard"
                  ? "bg-zinc-900 border-zinc-600 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Normal Running
            </button>
            <button
              onClick={() => handleSimModeChange("safety_car")}
              className={`px-5 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                simMode === "safety_car"
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Flag className="h-3.5 w-3.5 text-amber-500" /> Safety Car Delta (SC)
            </button>
            <button
              onClick={() => handleSimModeChange("undercut")}
              className={`px-5 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                simMode === "undercut"
                  ? "bg-red-950/40 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-red-500" /> Undercut Opportunity
            </button>
            <button
              onClick={() => handleSimModeChange("monsoon")}
              className={`px-5 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                simMode === "monsoon"
                  ? "bg-blue-950/40 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <CloudRain className="h-3.5 w-3.5 text-blue-500" /> Weather Change (Rain)
            </button>
          </div>

          {/* Main Dashboard Grid inside Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Box: Live Telemetry chart */}
            <div className="lg:col-span-8 flex flex-col">
              <Card className="border-zinc-800 bg-zinc-900/30 flex-1 flex flex-col backdrop-blur-sm">
                <CardHeader className="pb-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-lg tracking-wide uppercase text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-red-500" /> Live Speed Trace vs Track Distance
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-xs mt-1">Ingesting data from FIA global feed</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-red-500 border-red-500/30 bg-red-500/5 uppercase">
                    LIVE STREAMING
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={telemetry} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="simSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={simMode === "safety_car" ? "#f59e0b" : simMode === "monsoon" ? "#3b82f6" : "#ef4444"} stopOpacity={0.35}/>
                            <stop offset="95%" stopColor={simMode === "safety_car" ? "#f59e0b" : simMode === "monsoon" ? "#3b82f6" : "#ef4444"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="distance" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace'}} unit="m" />
                        <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace'}} domain={[0, 360]} unit="km/h" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ fontFamily: 'monospace', color: 'white', fontSize: 12 }}
                          labelStyle={{ fontFamily: 'monospace', color: '#71717a', fontSize: 10 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="speed"
                          name="Speed (km/h)"
                          stroke={simMode === "safety_car" ? "#f59e0b" : simMode === "monsoon" ? "#3b82f6" : "#ef4444"}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#simSpeedGrad)"
                          isAnimationActive={true}
                          animationDuration={500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Vitals Grid footer inside simulator */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-zinc-800/80 pt-6">
                    <TireWearWidget label="Front Left" wear={tires.flWear} temp={tires.flTemp} color={tires.flColor} />
                    <TireWearWidget label="Front Right" wear={tires.frWear} temp={tires.frTemp} color={tires.frColor} />
                    <TireWearWidget label="Rear Left" wear={tires.rlWear} temp={tires.rlTemp} color={tires.rlColor} />
                    <TireWearWidget label="Rear Right" wear={tires.rrWear} temp={tires.rrTemp} color={tires.rrColor} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Box: CASPER AI Decisions */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <Card className="border-red-500/30 bg-red-950/10 shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)] flex flex-col h-full justify-between relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 to-amber-500 animate-pulse"></div>
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                      <Zap className="h-5 w-5 fill-red-500" />
                      <span className="font-heading uppercase tracking-widest text-sm text-white">CASPER Action Matrix</span>
                    </div>
                    <Badge className={`font-mono text-[9px] font-bold rounded-sm px-2 py-0.5 ${strategy.urgencyColor}`}>
                      {strategy.urgency}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-white mt-3 uppercase tracking-wide">
                    {strategy.title}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs leading-relaxed mt-1">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  {/* Strategy Data rows */}
                  <div className="grid gap-2.5 font-mono text-xs mb-6">
                    <div className="flex justify-between py-2 border-b border-zinc-800/80">
                      <span className="text-zinc-500">Pit loss duration:</span>
                      <span className="text-white font-semibold">{strategy.pitLoss}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/80">
                      <span className="text-zinc-500">Position exit delta:</span>
                      <span className="text-green-400 font-semibold">{strategy.gapExit}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/80">
                      <span className="text-zinc-500">Target compound:</span>
                      <span className="flex items-center gap-1.5 font-semibold text-white">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tires.compoundColor}`}>
                          {tires.compound}
                        </span>
                        {strategy.compound}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-500">Decision Confidence:</span>
                      <span className="text-yellow-500 font-bold">{strategy.probability}</span>
                    </div>
                  </div>

                  {/* Action buttons with feedback message */}
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleActionClick}
                        className="w-2/3 h-12 bg-red-600 hover:bg-red-700 text-white font-semibold tracking-wider text-xs uppercase"
                      >
                        <Check className="mr-2 h-4 w-4" /> {strategy.actionText}
                      </Button>
                      <Button
                        onClick={() => setSimMessage("Strategy update rejected by Engineer. Hold instruction broadcasted.")}
                        variant="outline"
                        className="w-1/3 h-12 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white uppercase tracking-wider text-[10px]"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" /> Hold
                      </Button>
                    </div>

                    {simMessage && (
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono text-center animate-fade-in">
                        {simMessage}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      </section>

      {/* Grid of Dynamic Tech Features */}
      <section id="features" className="relative bg-zinc-950 px-6 py-24 border-b border-zinc-900 overflow-hidden">
        {/* Slanted gradient backdrop accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.03),transparent_60%)] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 mb-2 font-mono uppercase tracking-widest">
              Live calculations at 300+ km/h
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              ENGINEERED FOR THE PIT WALL
            </h2>
            <p className="font-google-flex mx-auto mt-4 max-w-2xl text-zinc-400">
              CASPER.AI shifts computations from standard batch strategy plots to dynamic milliseconds feedback loops. React to situations instantly.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Gauge className="h-6 w-6 text-red-500" />}
              title="Predictive Degradation"
              description="Ingests lateral tire loading coefficient curves and track abrasion scores to output exact stint crossover graphs."
              accentColor="border-t-red-600"
              bgImage="/lec-1.jpg"
              driverTag="LEC-16 // THERMAL DEGRADATION"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-amber-500" />}
              title="Dynamic Strategy"
              description="Performs 100k stochastic simulations in 12ms when Safety Cars, Virtual Safety Cars, or Local Yellows are flagged."
              accentColor="border-t-red-500"
              bgImage="/lec-2.jpg"
              driverTag="LEC-16 // STRATEGY SIMULATIONS"
            />
            <FeatureCard
              icon={<CloudRain className="h-6 w-6 text-blue-500" />}
              title="Micro-Climate Radar"
              description="Integrates tracking telemetry for local rain clouds to calculate track surface saturation ratios by sector."
              accentColor="border-t-blue-500"
              bgImage="/f1-car-neon.jpg"
              driverTag="TRACK RADAR // METRIC INPUTS"
            />
            <FeatureCard
              icon={<Flag className="h-6 w-6 text-yellow-500" />}
              title="Overtake Protection"
              description="Cross-references following driver lap times with your dirty-air decay rate to alarm undercut threats."
              accentColor="border-t-yellow-500"
              bgImage="/lewis-ham-1.jpg"
              driverTag="HAM-44 // OVERTAKE DELTA"
            />
          </div>
        </div>
      </section>

      {/* Human-in-the-Loop Protocol Section */}
      <section id="hitl" className="px-6 py-24 lg:py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row">
          
          {/* HITL Explainer */}
          <div className="flex flex-col items-start gap-6 lg:w-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 uppercase tracking-widest font-mono">
              <BrainCircuit className="h-4 w-4" />
              Human-In-The-Loop Protocol
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white leading-none">
              AI PROPOSES.<br />
              <span className="italic text-red-500">THE ENGINEER</span> DECIDES.
            </h2>
            <div className="font-google-flex space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                In Formula 1, full automation is a liability. Environmental anomalies, driver state of mind, and split-second tactical overrides require human intuition and guts.
              </p>
              <p>
                CASPER.AI acts as your high-speed co-pilot. It handles the raw mathematical computations and strategy pathing, surfacing recommendations on your console. The race engineer retains the absolute veto.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                <span className="text-2xl font-black text-red-500 block font-mono">12ms</span>
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Compute latency</span>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                <span className="text-2xl font-black text-white block font-mono">10,000+</span>
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Simulations/Sec</span>
              </div>
            </div>
          </div>

          {/* HITL Pipeline visualization */}
          <div className="w-full lg:w-1/2">
            <div className="space-y-4 font-mono">
              <PipelineStep
                number="01"
                title="RAW TELEMETRY INGESTION"
                desc="Ingesting 90+ car telemetry sensors at 12ms network round-trip speed."
                status="COMPLETED"
                statusColor="text-green-500 border-green-500/30 bg-green-500/5"
              />
              <PipelineStep
                number="02"
                title="STOCHASTIC AI COMPILATION"
                desc="Casper runs massive simulations calculating pit margins, tire decay, and overtake risks."
                status="COMPLETED"
                statusColor="text-green-500 border-green-500/30 bg-green-500/5"
              />
              <PipelineStep
                number="03"
                title="DECISION SUITE WARNING"
                desc="Alert is sent to Pit Wall dashboard displaying recommended compounds and target laps."
                status="PENDING ACTION"
                statusColor="text-red-400 border-red-500/30 bg-red-500/5 animate-pulse"
              />
              <PipelineStep
                number="04"
                title="ENGINEER VOICE COMMS CONFIRMED"
                desc="Race engineer clicks 'Confirm Box'. Instructions dispatched directly to the mechanic grid."
                status="WAITING APPROVAL"
                statusColor="text-zinc-500 border-zinc-800 bg-transparent"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Footer Metrics */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-12 text-xs text-zinc-500">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-red-500" />
              <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-white">
                CASPER<span className="text-red-500">.AI</span>
              </span>
            </div>
            <p className="font-google-flex max-w-xl text-zinc-400 text-sm leading-relaxed">
              State-of-the-art telemetry integration and pit lane strategy prediction curves designed for professional race teams and engineer monitors.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] tracking-wider uppercase font-mono">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-300">
                FIA CORE CHANNEL READY
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-300">
                STOCHASTIC ENGINE v4.2
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-300">
                LATENCY 12MS ACTIVE
              </span>
            </div>
          </div>

          {/* Quick HUD specs */}
          <div className="grid gap-3 sm:grid-cols-2">
            <HUDStat label="Circuit Status" value="ONLINE // LINK ACTIVE" valueColor="text-green-500" />
            <HUDStat label="Pit Radio Latency" value="12ms (average)" />
            <HUDStat label="Availability" value="99.98% System Uptime" />
            <HUDStat label="Approval Mode" value="Engineer Verification" />
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-zinc-900 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} CASPER AI Pit Systems. Optimized for the grid.</p>
          <div className="font-mono text-[10px]">
            SYSTEM READY: SYS ON
          </div>
        </div>
      </footer>
    </div>
  )
}

// -------------------------------------------------------------
// Helper UI Components below
// -------------------------------------------------------------

function TireWearWidget({ label, wear, temp, color }: { label: string; wear: number; temp: string; color: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 font-mono text-[10px]">
      <span className="text-zinc-500 uppercase">{label}</span>
      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-sm font-bold text-white">{wear}%</span>
        <span className="text-zinc-400">{temp}</span>
      </div>
      <div className="w-full bg-zinc-950 h-1.5 mt-1 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${wear}%` }}></div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accentColor,
  bgImage,
  driverTag
}: {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  bgImage?: string
  driverTag?: string
}) {
  return (
    <Card className={`relative overflow-hidden group h-[380px] flex flex-col justify-end border-zinc-800 bg-zinc-900/30 transition-all duration-300 hover:-translate-y-2 hover:border-zinc-700 hover:shadow-[0_10px_30px_rgba(239,68,68,0.15)] border-t-2 ${accentColor} backdrop-blur-sm`}>
      {bgImage && (
        <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src={bgImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-20 group-hover:opacity-45 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500"
          />
          {/* Intense gradient overlay to keep text perfectly readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
      )}
      
      <CardHeader className="relative z-10 pb-2">
        {driverTag && (
          <span className="font-mono text-[9px] text-red-500 tracking-[0.2em] font-semibold mb-2 block uppercase">
            {driverTag}
          </span>
        )}
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950/85 border border-zinc-800 text-white backdrop-blur-xs">
          {icon}
        </div>
        <CardTitle className="font-heading text-lg text-white uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        <CardDescription className="text-xs leading-relaxed text-zinc-300 font-google-flex">
          {description}
        </CardDescription>
        
        {/* Subtle telemetry status feed overlay */}
        <div className="mt-4 pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[9px] font-mono text-zinc-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <span>LATENCY: 12ms</span>
          <span className="text-red-500 font-semibold tracking-widest animate-pulse">ACTIVE FEED</span>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineStep({
  number,
  title,
  desc,
  status,
  statusColor
}: {
  number: string
  title: string
  desc: string
  status: string
  statusColor: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm hover:border-zinc-700 transition-colors">
      <span className="text-lg font-black text-red-500/70">{number}</span>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-white tracking-wider uppercase">{title}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>
            {status}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500 font-google-flex">{desc}</p>
      </div>
    </div>
  )
}

function HUDStat({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 font-mono">
      <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`mt-1.5 text-xs font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}
