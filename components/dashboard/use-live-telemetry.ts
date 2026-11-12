"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type Compound = "S" | "M" | "H"
export type SectorState = "purple" | "green" | "yellow"
export type Flag = "GREEN" | "YELLOW" | "VSC"

export type RosterEntry = {
  id?: string | number | null
  driverNumber?: number | string | null
  acronym?: string | null
  fullName?: string | null
  broadcastName?: string | null
}

export type TracePoint = { i: number; speed: number; throttle: number; brake: number }
export type LapPoint = { lap: number; time: number; pace: number; pit: boolean }

export type TowerRow = {
  id: string
  pos: number
  acronym: string
  number: number | string
  gap: number
  interval: number
  compound: Compound
  age: number
  lastLap: string
  us: boolean
}

export type RadioMsg = {
  id: number
  lap: number
  from: "ENG" | "DRV" | "RACE CTRL"
  text: string
  level: "info" | "warn" | "alert"
}

export type StrategyOption = {
  name: string
  pitLap: number
  next: Compound
  delta: number
  prob: number
}

export type Telemetry = {
  clock: string
  speed: number
  rpm: number
  gear: number
  throttle: number
  brake: number
  drs: boolean
  lap: number
  sector: number
  curLap: string
  lastLap: string
  bestLap: string
  delta: number
  sectors: { time: string; state: SectorState }[]
  trace: TracePoint[]
  laps: LapPoint[]
  tyre: {
    compound: Compound
    age: number
    wear: number[]
    temps: number[]
    pressures: number[]
  }
  brakeTemps: number[]
  engine: { water: number; oil: number; ice: number; turbo: number }
  ers: { battery: number; mode: "DEPLOY" | "HARVEST" | "HOLD" }
  fuel: { kg: number; perLap: number; lapsLeft: number; target: number }
  weather: { air: number; track: number; humidity: number; wind: number; windDir: number; rain: number }
  position: number
  gapAhead: number
  gapBehind: number
  tower: TowerRow[]
  radio: RadioMsg[]
  flag: Flag
  pit: { open: boolean; opens: number; closes: number; recommended: number }
  strategy: StrategyOption[]
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const hashOf = (s: string) => {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}
export function fmtLap(seconds: number) {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, "0")}`
}
const fmtClock = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":")
}

const LAP_MS = 20000 // one simulated lap = 20s wall-clock
const LAP_S = 88.4
const STINT = 20
const COMPOUNDS: Compound[] = ["M", "H", "S"]
const WEAR_RATE: Record<Compound, number> = { S: 5.4, M: 3.7, H: 2.7 }
const CORNER_BIAS = [1.0, 1.08, 0.9, 0.96]
const FALLBACK: RosterEntry[] = [
  ["VER", 1], ["NOR", 4], ["LEC", 16], ["PIA", 81], ["HAM", 44], ["RUS", 63], ["SAI", 55], ["ALO", 14],
  ["GAS", 10], ["ALB", 23], ["TSU", 22], ["HUL", 27], ["OCO", 31], ["STR", 18], ["BOT", 77],
].map(([a, n]) => ({ id: String(a), acronym: a as string, driverNumber: n as number }))

const lapTimeFor = (i: number, totalLaps: number) => {
  const n = i % Math.max(totalLaps, 1)
  const age = (n % STINT) + 1
  const fuel = Math.max(0, 105 - n * 1.85)
  return 88.2 + age * 0.055 + fuel * 0.028 + (((i * 7919) % 100) / 100) * 0.7 + (age === 1 && n > 0 ? 1.8 : 0)
}

const emptyT = (): Telemetry => ({
  clock: "00:00:00", speed: 0, rpm: 0, gear: 1, throttle: 0, brake: 0, drs: false, lap: 1, sector: 1,
  curLap: "0:00.000", lastLap: "–", bestLap: "–", delta: 0,
  sectors: [0, 1, 2].map(() => ({ time: "–", state: "yellow" as SectorState })),
  trace: [], laps: [],
  tyre: { compound: "M", age: 1, wear: [0, 0, 0, 0], temps: [90, 90, 90, 90], pressures: [21.5, 21.5, 21.5, 21.5] },
  brakeTemps: [400, 400, 350, 350],
  engine: { water: 100, oil: 115, ice: 900, turbo: 0 },
  ers: { battery: 80, mode: "HOLD" },
  fuel: { kg: 105, perLap: 1.85, lapsLeft: 56, target: 0 },
  weather: { air: 27, track: 41, humidity: 55, wind: 12, windDir: 120, rain: 15 },
  position: 1, gapAhead: 0, gapBehind: 0, tower: [], radio: [], flag: "GREEN",
  pit: { open: false, opens: 14, closes: 20, recommended: 17 }, strategy: [],
})

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */
export function useLiveTelemetry(opts: {
  seed: number
  totalLaps: number
  roster: RosterEntry[]
  driverId?: string | number | null
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const carDots = useRef<Map<string, SVGCircleElement>>(new Map())
  const towerRef = useRef<TowerRow[]>([])
  const optsRef = useRef(opts)
  const [t, setT] = useState<Telemetry>(emptyT)

  useEffect(() => {
    optsRef.current = opts
  })

  const registerCar = useCallback(
    (id: string) => (el: SVGCircleElement | null) => {
      if (el) carDots.current.set(id, el)
      else carDots.current.delete(id)
    },
    [],
  )

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const phase = (opts.seed % 628) / 100
    const speedAt = (p: number) =>
      clamp(205 + 105 * Math.sin(2 * Math.PI * p * 4 + phase) + 35 * Math.sin(2 * Math.PI * p * 9 + phase * 2), 78, 338)

    const start = performance.now()
    const trace: TracePoint[] = []
    const laps: LapPoint[] = []
    const radio: RadioMsg[] = []
    const brakeT = [420, 410, 360, 355]
    let battery = 78
    let radioId = 0
    let traceI = 0
    let lastIdx = -1
    let lastFlag: Flag = "GREEN"
    let lastTick = 0
    let raf = 0

    const say = (lap: number, from: RadioMsg["from"], text: string, level: RadioMsg["level"] = "info") => {
      radio.unshift({ id: radioId++, lap, from, text, level })
      if (radio.length > 8) radio.pop()
    }

    const frame = (now: number) => {
      const { roster, driverId, totalLaps } = optsRef.current
      const elapsed = now - start
      const p = (elapsed % LAP_MS) / LAP_MS
      const idx = Math.floor(elapsed / LAP_MS)
      const lapNo = idx % Math.max(totalLaps, 1)

      /* ---- car dots on the track (every frame) ---- */
      const path = pathRef.current
      if (path) {
        const len = path.getTotalLength()
        const place = (el: SVGCircleElement | null | undefined, q: number) => {
          if (!el) return
          const pt = path.getPointAtLength((((q % 1) + 1) % 1) * len)
          el.setAttribute("cx", pt.x.toFixed(2))
          el.setAttribute("cy", pt.y.toFixed(2))
        }
        place(dotRef.current, p)
        const us = towerRef.current.find((r) => r.us)
        if (us) {
          for (const [id, el] of carDots.current) {
            const c = towerRef.current.find((r) => r.id === id)
            if (c && !c.us) place(el, p - (c.gap - us.gap) / LAP_S)
          }
        }
      }

      /* ---- throttled state update ---- */
      if (now - lastTick > (reduce ? 1000 : 100)) {
        lastTick = now

        // physics
        const speed = speedAt(p) + (Math.random() - 0.5) * 4
        const trend = speedAt(p + 0.01) - speedAt(p)
        const brake = trend < -6 ? clamp(Math.abs(trend) * 4, 30, 100) : 0
        const throttle = brake > 0 ? 0 : trend > 6 ? 100 : 72 + Math.random() * 20
        const gear = clamp(Math.floor(speed / 42) + 1, 2, 8)
        const rpm = clamp(7200 + ((speed % 42) / 42) * 5200 + Math.random() * 150, 6500, 12500)
        const drs = throttle > 95 && speed > 255 && lapNo > 0 && ((p > 0.04 && p < 0.17) || (p > 0.55 && p < 0.68))
        trace.push({ i: traceI++, speed: Math.round(speed), throttle: Math.round(throttle), brake: Math.round(brake) })
        if (trace.length > 80) trace.shift()

        // ERS
        battery = clamp(battery + (brake > 0 ? 0.9 : throttle > 95 ? -0.55 : 0.05), 4, 100)
        const ersMode = brake > 0 ? "HARVEST" : throttle > 95 ? "DEPLOY" : "HOLD"

        // tyres / fuel
        const age = (lapNo % STINT) + 1
        const compound = COMPOUNDS[Math.floor(lapNo / STINT) % 3]
        const wear = CORNER_BIAS.map((b) => clamp(age * WEAR_RATE[compound] * b + p * WEAR_RATE[compound], 0, 100))
        const temps = CORNER_BIAS.map((b, k) =>
          Math.round(86 + speed * 0.03 + brake * 0.05 + (k < 2 ? 3 : 0) + b * 4 + Math.random() * 1.5),
        )
        const pressures = temps.map((tt) => +(21.2 + (tt - 90) * 0.05).toFixed(1))
        brakeT.forEach((v, k) => {
          const target = 330 + (k < 2 ? 60 : 0) + (brake > 0 ? 520 : 0)
          brakeT[k] = v + (target - v) * 0.06
        })
        const fuelKg = Math.max(0, 105 - lapNo * 1.85 - p * 1.85)

        // lap rollover
        const lapTime = lapTimeFor(idx, totalLaps)
        if (idx !== lastIdx) {
          if (idx > 0) {
            const prev = lapTimeFor(idx - 1, totalLaps)
            const pitLap = (((idx - 1) % totalLaps) % STINT) === 0 && (idx - 1) % totalLaps > 0
            laps.push({ lap: ((idx - 1) % totalLaps) + 1, time: +prev.toFixed(3), pace: 0, pit: pitLap })
            if (laps.length > 24) laps.shift()
            const recent = laps.slice(-3)
            const avg = recent.reduce((a, l) => a + l.time, 0) / recent.length
            laps.forEach((l, k) => {
              const w = laps.slice(Math.max(0, k - 2), k + 1)
              l.pace = +(w.reduce((a, x) => a + x.time, 0) / w.length).toFixed(3)
            })
            const us = towerRef.current.find((r) => r.us)
            const msgs: [RadioMsg["from"], string, RadioMsg["level"]][] = [
              ["ENG", `Gap ahead ${(us?.interval ?? 1.2).toFixed(1)}s. DRS window next lap.`, "info"],
              ["ENG", `Rolling pace ${fmtLap(avg)}. Tyres in the window, push available.`, "info"],
              ["RACE CTRL", "Debris reported turn 7. Marshals deployed.", "warn"],
              ["ENG", `Box window opens in ${Math.max(0, 14 - age)} laps. Prepare for undercut.`, "info"],
              ["DRV", "Rears are starting to grain, can we cover the gap?", "warn"],
              ["ENG", "Fuel target +0.3. Lift and coast into turn 10.", "alert"],
            ]
            const m = msgs[idx % msgs.length]
            say(lapNo + 1, m[0], m[1], m[2])
          }
          lastIdx = idx
        }

        // flag
        const flag: Flag = lapNo % 13 === 7 && p > 0.35 && p < 0.7 ? "YELLOW" : "GREEN"
        if (flag !== lastFlag) {
          say(lapNo + 1, "RACE CTRL", flag === "YELLOW" ? "YELLOW FLAG sector 2. Car stopped on track." : "Track clear. Green flag.", flag === "YELLOW" ? "alert" : "info")
          lastFlag = flag
        }

        // timing tower
        const list = (roster.length ? roster : FALLBACK).slice(0, 20)
        let usIdx = list.findIndex((d) => driverId != null && String(d.id) === String(driverId))
        if (usIdx < 0) usIdx = Math.min(3, list.length - 1)
        const raw = list.map((d, i) => {
          const id = String(d.id ?? i)
          const h = hashOf(id)
          const off = i * 1.3 + 1.1 * Math.sin(elapsed / 9000 + (h % 7))
          const cAge = ((h % 9) + lapNo) % 24 + 1
          return {
            id,
            off,
            acronym: d.acronym ?? d.broadcastName?.slice(0, 3).toUpperCase() ?? "---",
            number: d.driverNumber ?? "–",
            compound: COMPOUNDS[(h >> 3) % 3],
            age: cAge,
            lastLap: fmtLap(LAP_S + ((h % 100) / 100) * 1.2),
            us: i === usIdx,
          }
        }).sort((a, b) => a.off - b.off)
        const lead = raw[0]?.off ?? 0
        const tower: TowerRow[] = raw.map((r, k) => ({
          id: r.id, pos: k + 1, acronym: r.acronym, number: r.number, compound: r.compound, age: r.age,
          lastLap: r.lastLap, us: r.us, gap: r.off - lead, interval: k === 0 ? 0 : r.off - raw[k - 1].off,
        }))
        towerRef.current = tower
        const usRow = tower.find((r) => r.us)
        const usPos = usRow?.pos ?? 1
        const behind = tower[usPos] // next entry (pos+1)

        // sectors for last lap
        const lastTime = idx > 0 ? lapTimeFor(idx - 1, totalLaps) : 0
        const split = [0.3, 0.37, 0.33]
        const sectors = split.map((f, k) => {
          const h = ((idx - 1) * 3 + k) * 2654435761 >>> 0
          const state: SectorState = h % 10 < 1 ? "purple" : h % 10 < 5 ? "green" : "yellow"
          const secs = lastTime * f
          return { time: idx > 0 ? secs.toFixed(3) : "–", state }
        })
        const best = laps.length ? Math.min(...laps.map((l) => l.time)) : 0

        // strategy
        const wearAvg = wear.reduce((a, b) => a + b, 0) / 4
        const nextC = COMPOUNDS[(Math.floor(lapNo / STINT) + 1) % 3]
        const stintStart = Math.floor(lapNo / STINT) * STINT
        const gapA = usRow?.interval ?? 2
        const strategy: StrategyOption[] = [
          { name: "Undercut", pitLap: lapNo + 2, next: nextC, delta: -(0.6 + wearAvg * 0.012), prob: clamp(Math.round(48 + wearAvg * 0.4 - gapA * 6), 5, 95) },
          { name: "Standard", pitLap: stintStart + 17, next: nextC, delta: 0, prob: clamp(Math.round(62 - Math.abs(age - 17) * 2), 5, 95) },
          { name: "Overcut", pitLap: stintStart + 22, next: nextC, delta: +(0.9 - wearAvg * 0.004), prob: clamp(Math.round(40 - wearAvg * 0.3 + gapA * 3), 5, 95) },
        ]

        const clockSec = (elapsed / 1000) * 4.42
        const wob = Math.sin(elapsed / 60000)

        setT({
          clock: fmtClock(clockSec),
          speed: Math.round(speed), rpm: Math.round(rpm), gear,
          throttle: Math.round(throttle), brake: Math.round(brake), drs,
          lap: lapNo + 1, sector: Math.min(3, Math.floor(p * 3) + 1),
          curLap: fmtLap(p * lapTime),
          lastLap: idx > 0 ? fmtLap(lastTime) : "–",
          bestLap: best ? fmtLap(best) : "–",
          delta: +(0.35 * Math.sin(2 * Math.PI * p * 2 + phase) * Math.min(1, p * 3)).toFixed(3),
          sectors,
          trace: [...trace], laps: laps.map((l) => ({ ...l })),
          tyre: { compound, age, wear, temps, pressures },
          brakeTemps: brakeT.map(Math.round),
          engine: {
            water: Math.round(102 + 4 * Math.sin(elapsed / 7000) + throttle * 0.02),
            oil: Math.round(116 + 3 * Math.sin(elapsed / 9000) + throttle * 0.03),
            ice: Math.round(880 + throttle * 0.8),
            turbo: +(1.2 + (throttle / 100) * 2.4).toFixed(1),
          },
          ers: { battery: Math.round(battery), mode: ersMode },
          fuel: { kg: +fuelKg.toFixed(1), perLap: 1.85, lapsLeft: +(fuelKg / 1.85).toFixed(1), target: +(fuelKg / 1.85 - (totalLaps - lapNo)).toFixed(1) },
          weather: {
            air: +(27 + wob).toFixed(1), track: +(41 + 2 * wob).toFixed(1),
            humidity: Math.round(55 + 5 * wob), wind: Math.round(12 + 4 * Math.sin(elapsed / 15000)),
            windDir: Math.round(120 + 30 * wob), rain: clamp(Math.round(18 + 12 * wob), 0, 100),
          },
          position: usPos, gapAhead: usRow?.interval ?? 0, gapBehind: behind?.interval ?? 0,
          tower, radio: radio.map((r) => ({ ...r })), flag,
          pit: { open: age >= 14, opens: stintStart + 14, closes: stintStart + 20, recommended: stintStart + 17 },
          strategy,
        })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.seed])

  return { pathRef, dotRef, registerCar, t }
}
