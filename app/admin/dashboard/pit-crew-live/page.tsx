"use client"

import { useState, useEffect } from "react"
import {
  Check,
  Radio,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from "lucide-react"
import { usePitCrewLive } from "@/hooks/use-pit-crew-live"
import { normalizeCompound, Tyre } from "@/components/race-sequence-management/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function WheelGunReadiness() {
  const [wheelGuns, setWheelGuns] = useState({
    fl: false,
    fr: false,
    rl: false,
    rr: false,
  })

  const toggleGun = (corner: keyof typeof wheelGuns) => {
    setWheelGuns((prev) => ({ ...prev, [corner]: !prev[corner] }))
  }

  const allGunsReady =
    wheelGuns.fl && wheelGuns.fr && wheelGuns.rl && wheelGuns.rr

  return (
    <Card className="border border-white/10 bg-zinc-950/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            WHEEL GUN READINESS CHECK (TAP WHEN GUNNER IN POSITION)
          </span>
        </div>
        <Badge
          className={cn(
            "font-bold",
            allGunsReady
              ? "bg-emerald-500 text-black"
              : "bg-zinc-800 text-zinc-400"
          )}
        >
          {allGunsReady ? "CREW ARMED & READY" : "ARMING IN PROGRESS"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { key: "fl", label: "FRONT LEFT" },
          { key: "fr", label: "FRONT RIGHT" },
          { key: "rl", label: "REAR LEFT" },
          { key: "rr", label: "REAR RIGHT" },
        ].map((gun) => {
          const active = wheelGuns[gun.key as keyof typeof wheelGuns]
          return (
            <Button
              key={gun.key}
              type="button"
              onClick={() => toggleGun(gun.key as keyof typeof wheelGuns)}
              className={cn(
                "h-24 flex flex-col items-center justify-center border-2 transition-all text-xs font-bold",
                active
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
              )}
            >
              <span className="text-sm font-black">{gun.label}</span>
              <span className="mt-1 flex items-center gap-1 text-[10px]">
                {active ? (
                  <>
                    <Check className="h-3 w-3" /> GUN LOCKED
                  </>
                ) : (
                  "STANDBY"
                )}
              </span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}

export default function PitCrewLivePage() {
  const { strategy, isConnected } = usePitCrewLive()
  const [audioEnabled, setAudioEnabled] = useState(false)

  const isBoxNow =
    strategy?.action === "BOX_THIS_LAP" || strategy?.alert_level === "RED"

  // Optional synthesised audio tone for BOX NOW alerts
  useEffect(() => {
    if (isBoxNow && audioEnabled && typeof window !== "undefined") {
      try {
        const audioContextConstructor =
          window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!audioContextConstructor) return

        const audioCtx = new audioContextConstructor()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 tone
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.4)
      } catch {
        // AudioContext blocked
      }
    }
  }, [isBoxNow, audioEnabled])

  // Accepts SOFT / Soft / S, INTER / Intermediate / I, etc.
  const getCompoundColors = (compound?: string | null) => {
    switch (normalizeCompound(compound)) {
      case "soft":
        return "border-red-500 text-red-500 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.25)]"
      case "medium":
        return "border-yellow-400 text-yellow-400 bg-yellow-400/10 shadow-[0_0_40px_rgba(250,204,21,0.25)]"
      case "hard":
        return "border-white text-white bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.25)]"
      case "intermediate":
        return "border-emerald-400 text-emerald-400 bg-emerald-400/10 shadow-[0_0_40px_rgba(52,211,153,0.25)]"
      case "wet":
        return "border-blue-500 text-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.25)]"
      default:
        return "border-zinc-700 text-zinc-400 bg-zinc-900/60"
    }
  }

  const weatherCompound = strategy?.meta?.weather_intel?.recommended_compound
  const weatherHasImage = normalizeCompound(weatherCompound) !== null

  return (
    <div
      className={cn(
        "min-h-screen p-4 md:p-8 font-mono select-none transition-colors duration-500",
        isBoxNow
          ? "bg-red-950/40 text-red-100"
          : "bg-black text-zinc-100"
      )}
    >
      {/* Top Header Ribbon */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border",
              isBoxNow
                ? "border-red-500 bg-red-600 text-white animate-bounce"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black tracking-widest uppercase">
                PIT CREW LIVE GANTRY
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-[10px]",
                  isConnected
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
                )}
              >
                <Radio className="mr-1.5 h-3 w-3" />
                {isConnected ? "WS STREAM LIVE" : "DISCONNECTED"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              TARGET CHASSIS: {strategy?.driverName ?? "PILOT 01"} #
              {strategy?.driverNumber ?? 1} / lap {strategy?.currentLap ?? 16}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-800 bg-zinc-900/80 text-xs"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="mr-1.5 h-4 w-4 text-emerald-400" />
                AUDIO SIREN ON
              </>
            ) : (
              <>
                <VolumeX className="mr-1.5 h-4 w-4 text-zinc-500" />
                AUDIO MUTED
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Tactical Split */}
      <main className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Command Callout (8 cols) */}
        <section className="space-y-6 lg:col-span-8">
          {/* Tactical Instruction Display */}
          <Card
            className={cn(
              "border-2 transition-all p-6",
              isBoxNow
                ? "border-red-600 bg-black/80 shadow-[0_0_80px_rgba(239,68,68,0.3)] animate-pulse"
                : "border-zinc-800 bg-zinc-950/60"
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                ACTIVE STRATEGY DIRECTIVE
              </span>
              <span
                className={cn(
                  "rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider",
                  strategy?.alert_level === "RED"
                    ? "bg-red-600 text-white"
                    : strategy?.alert_level === "AMBER"
                      ? "bg-amber-400 text-black"
                      : "bg-emerald-600 text-white"
                )}
              >
                ALERT: {strategy?.alert_level ?? "STANDBY"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  GANTRY COMMAND
                </span>
                <div
                  className={cn(
                    "text-6xl sm:text-8xl font-black tracking-tighter leading-none mt-1",
                    isBoxNow ? "text-red-500" : "text-white"
                  )}
                >
                  {strategy?.action ?? "STAY_OUT"}
                </div>
                <p className="mt-4 text-sm text-zinc-300 max-w-xl">
                  {strategy?.reasoning ??
                    "Awaiting tactical briefing call from Sophie AI pipeline."}
                </p>
              </div>

              {/* Target Compound Stamp */}
              {strategy?.target_compound && (
                <div
                  className={cn(
                    "flex min-w-64 flex-col items-center justify-center rounded-2xl border-2 px-8 py-6",
                    getCompoundColors(strategy.target_compound)
                  )}
                >
                  <Tyre
                    compound={strategy.target_compound}
                    size={140}
                    className={cn(
                      "drop-shadow-[0_0_24px_currentColor]",
                      isBoxNow && " motion-reduce:animate-none"
                    )}
                  />
                  <span className="mt-3 text-[10px] font-bold uppercase tracking-widest">
                    FITTED COMPOUND
                  </span>
                  <span className="text-4xl sm:text-5xl font-black tracking-widest">
                    {strategy.target_compound}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 4-Corner Wheel Gun Readiness */}
          <div key={`${strategy?.action ?? "STAY_OUT"}:${strategy?.target_compound ?? ""}`}>
            <WheelGunReadiness />
          </div>
        </section>

        {/* Right Telemetry Snapshot & Pace Horizon (4 cols) */}
        <section className="space-y-6 lg:col-span-4">
          <Card className="border border-white/10 bg-zinc-950/60 p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              TYRE HORIZON & TELEMETRY
            </span>

            <div className="space-y-3 pt-2">
              {strategy?.target_compound && (
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-zinc-400">NEXT SET</span>
                  <span className="flex items-center gap-2 font-bold">
                    <Tyre compound={strategy.target_compound} size={36} />
                    {strategy.target_compound}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">DEGRADATION REGIME</span>
                <span className="font-bold text-amber-400">
                  {strategy?.tyre_stage ?? "STABLE"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">REMAINING LIFE</span>
                <span className="font-bold text-cyan-400">
                  {strategy?.remaining_life ?? 20} LAPS
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">UNDERCUT CHANCE</span>
                <span className="font-bold text-yellow-400">
                  {((strategy?.undercut_probability ?? 0) * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">WEATHER COND.</span>
                <span className="flex items-center gap-2 font-bold text-emerald-400">
                  {weatherHasImage && weatherCompound && <Tyre compound={weatherCompound} size={28} />}
                  {weatherCompound ?? "SLICK (DRY)"}
                </span>
              </div>
            </div>
          </Card>

          {/* Predicted Next Laps Pace Vector */}
          {strategy?.predicted_pace_vector && strategy.predicted_pace_vector.length > 0 && (
            <Card className="border border-white/10 bg-zinc-950/60 p-6">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                PACE VECTOR (NEXT {Math.min(strategy.predicted_pace_vector.length, 6)} LAPS)
              </span>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {strategy.predicted_pace_vector.slice(0, 6).map((lapTime, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs"
                  >
                    <span className="text-zinc-500">+{idx + 1} LAP</span>
                    <span className="font-bold text-emerald-400">
                      {lapTime.toFixed(3)}s
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}