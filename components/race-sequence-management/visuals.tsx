import Image from "next/image"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Tyre compounds                                                            */
/* -------------------------------------------------------------------------- */

export type CompoundKey = "soft" | "medium" | "hard" | "intermediate" | "wet"

export const COMPOUND_META: Record<
  CompoundKey,
  { label: string; short: string; src: string; text: string; border: string; bg: string }
> = {
  soft: { label: "SOFT", short: "S", src: "/soft_tires.png", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10" },
  medium: { label: "MEDIUM", short: "M", src: "/medium_tires.png", text: "text-yellow-300", border: "border-yellow-400/50", bg: "bg-yellow-400/10" },
  hard: { label: "HARD", short: "H", src: "/hard_tires.png", text: "text-zinc-100", border: "border-zinc-300/50", bg: "bg-zinc-300/10" },
  intermediate: { label: "INTERS", short: "I", src: "/intermediate_tires.png", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10" },
  wet: { label: "WET", short: "W", src: "/wet_tires.png", text: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10" },
}

/** Accepts "Soft", "SOFT", "S", "Inters", "Intermediate", "I", "W", ... from the API or the socket. */
export function normalizeCompound(value?: string | null): CompoundKey | null {
  const v = (value ?? "").trim().toLowerCase()
  if (!v) return null
  if (v === "s" || v.startsWith("soft")) return "soft"
  if (v === "m" || v.startsWith("med")) return "medium"
  if (v === "h" || v.startsWith("hard")) return "hard"
  if (v === "i" || v.startsWith("inter")) return "intermediate"
  if (v === "w" || v.startsWith("wet")) return "wet"
  return null
}

/** Compound picture from /public. Falls back to a lettered ring for unknown values. */
export function Tyre({ compound, size = 44, dim = false, className }: { compound?: string | null; size?: number; dim?: boolean; className?: string }) {
  const key = normalizeCompound(compound)

  if (!key) {
    return (
      <span
        role="img"
        aria-label={`${compound} tyre`}
        style={{ width: size, height: size, fontSize: size * 0.34 }}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-full border-2 border-zinc-500 bg-zinc-950 font-bold text-zinc-100", dim && "opacity-45", className)}
      >
        {compound?.charAt(0).toUpperCase() || "?"}
      </span>
    )
  }

  const meta = COMPOUND_META[key]
  return (
    <Image
      src={meta.src}
      alt={`${meta.label.toLowerCase()} tyre`}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className={cn("shrink-0 object-contain drop-shadow-md transition-opacity", dim && "opacity-45", className)}
    />
  )
}

/** Picture + big readable name, for pit-crew callouts ("FIT HARD"). */
export function CompoundBadge({
  compound,
  size = 40,
  prefix,
  suffix,
  className,
}: {
  compound?: string | null
  size?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const key = normalizeCompound(compound)
  const meta = key ? COMPOUND_META[key] : null
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", meta?.border ?? "border-border/50", meta?.bg ?? "bg-muted/20", className)}>
      <Tyre compound={compound ?? ""} size={size} />
      <div className="leading-tight">
        {prefix && <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{prefix}</p>}
        <p className={cn("font-heading text-xl font-black tracking-wide", meta?.text)}>{meta?.label ?? (compound?.toUpperCase() ?? "—")}</p>
        {suffix && <p className="font-mono text-[11px] text-muted-foreground">{suffix}</p>}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Track helpers                                                             */
/* -------------------------------------------------------------------------- */

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