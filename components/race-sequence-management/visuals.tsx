import { useMemo } from "react"

import { cn } from "@/lib/utils"

const TYRE_STYLE: Record<string, { letter: string; ring: string }> = {
  Soft: { letter: "S", ring: "border-red-500" },
  Medium: { letter: "M", ring: "border-yellow-400" },
  Hard: { letter: "H", ring: "border-zinc-200" },
  Inters: { letter: "I", ring: "border-green-500" },
  Wet: { letter: "W", ring: "border-blue-500" },
}

/** Tyre drawn the way pit crews read it: coloured sidewall ring, dark tread. */
export function Tyre({ compound, size = 44, dim = false }: { compound: string; size?: number; dim?: boolean }) {
  const s = TYRE_STYLE[compound] ?? { letter: compound.charAt(0).toUpperCase() || "?", ring: "border-zinc-500" }
  return (
    <span
      role="img"
      aria-label={`${compound} tyre`}
      style={{ width: size, height: size, borderWidth: Math.max(3, Math.round(size * 0.14)), fontSize: size * 0.34 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-950 font-bold text-zinc-100 transition-opacity",
        s.ring,
        dim && "opacity-45"
      )}
    >
      {s.letter}
    </span>
  )
}

export function seedOf(value: string) {
  return value.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
}

/** Deterministic closed-loop outline so every circuit gets its own silhouette. */
export function trackPath(seed: number) {
  let s = seed || 1
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  const n = 9
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = 18 + rnd() * 18
    return [50 + Math.cos(a) * r * 1.25, 50 + Math.sin(a) * r * 0.95]
  })
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const f = (v: number) => v.toFixed(1)
  const start = mid(pts[n - 1], pts[0])
  let d = `M ${f(start[0])} ${f(start[1])}`
  for (let i = 0; i < n; i++) {
    const c = pts[i]
    const m = mid(pts[i], pts[(i + 1) % n])
    d += ` Q ${f(c[0])} ${f(c[1])} ${f(m[0])} ${f(m[1])}`
  }
  return d + " Z"
}

export function TrackGlyph({ seed, className, thick = false }: { seed: number; className?: string; thick?: boolean }) {
  const d = useMemo(() => trackPath(seed), [seed])
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeOpacity={0.25} strokeWidth={thick ? 9 : 8} strokeLinejoin="round" />
      <path d={d} stroke="currentColor" strokeWidth={thick ? 2.5 : 3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}