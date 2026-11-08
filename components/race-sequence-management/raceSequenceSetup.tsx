"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Car, Check, CheckCircle2, Loader2, Play, RefreshCcw, Save } from "lucide-react"

import { useGetCars, useGetCircuits, useGetDrivers } from "@/api/endpoints/asset-controller/asset-controller"
import {
  useGetActiveSequence,
  useInitiateSequence,
  useSaveOrUpdateSequence,
} from "@/api/endpoints/race-sequence-controller/race-sequence-controller"
import {
  type CarConfigDto,
  type CarDto,
  type CircuitDto,
  type DriverDto,
  RaceSequenceSaveRequestSequenceType,
  type RaceSequenceSaveRequest,
} from "@/api/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Constants & pure helpers                                                  */
/* -------------------------------------------------------------------------- */

const COMPOUND_OPTIONS = ["Soft", "Medium", "Hard", "Wet", "Inters"] as const
type Compound = (typeof COMPOUND_OPTIONS)[number]

const COMPOUND_STYLE: Record<Compound, { letter: string; ring: string; note: string }> = {
  Soft: { letter: "S", ring: "border-red-500", note: "Fastest, wears quickly" },
  Medium: { letter: "M", ring: "border-yellow-400", note: "Balanced pace and life" },
  Hard: { letter: "H", ring: "border-zinc-200", note: "Slowest, longest stints" },
  Inters: { letter: "I", ring: "border-green-500", note: "Damp or drying track" },
  Wet: { letter: "W", ring: "border-blue-500", note: "Heavy rain" },
}

const DEFAULT_CAR_CONFIGURATION: CarConfigDto = {
  engineName: "",
  engineType: "",
  enginePower: 0,
  transmissionType: "",
  suspensionType: "",
  brakeType: "",
  maxSpeed: 0,
  weight: 0,
  length: 0,
}

const SETUP_GROUPS: {
  title: string
  fields: { key: keyof CarConfigDto; label: string; numeric?: boolean; unit?: string }[]
}[] = [
  {
    title: "Power unit",
    fields: [
      { key: "engineName", label: "Engine name" },
      { key: "engineType", label: "Engine type" },
      { key: "enginePower", label: "Engine power", numeric: true },
    ],
  },
  {
    title: "Chassis",
    fields: [
      { key: "transmissionType", label: "Transmission" },
      { key: "suspensionType", label: "Suspension" },
      { key: "brakeType", label: "Brake package" },
    ],
  },
  {
    title: "Limits",
    fields: [
      { key: "maxSpeed", label: "Max speed", numeric: true, unit: "km/h" },
      { key: "weight", label: "Weight", numeric: true, unit: "kg" },
      { key: "length", label: "Length", numeric: true },
    ],
  },
]

type SequenceType = RaceSequenceSaveRequestSequenceType

type RaceSequenceFormState = {
  sequenceType: SequenceType
  driverId: string
  circuitId: string
  carId: string
  selectedCompounds: string[]
  customLapCount: number
  weatherInfo: string
  customCarSetup: CarConfigDto
}

function createEmptyForm(): RaceSequenceFormState {
  return {
    sequenceType: RaceSequenceSaveRequestSequenceType.RACE_WEEKEND,
    driverId: "",
    circuitId: "",
    carId: "",
    selectedCompounds: ["Soft"],
    customLapCount: 0,
    weatherInfo: "",
    customCarSetup: { ...DEFAULT_CAR_CONFIGURATION },
  }
}

function getFirstAvailableId<T extends { id?: string }>(items: T[]) {
  return items.find((item) => Boolean(item.id))?.id ?? ""
}

function hashLabel(value: string) {
  return value.split("").reduce((total, character) => total + character.charCodeAt(0), 0)
}

function seedOf(value: string) {
  return value.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
}

function getRaceDistance(sequenceType: SequenceType) {
  return sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? 305 : 120
}

function getSuggestedLapCount(circuit: CircuitDto | undefined, sequenceType: SequenceType) {
  const trackLength = circuit?.length && circuit.length > 0 ? circuit.length : 5
  return Math.max(8, Math.round(getRaceDistance(sequenceType) / trackLength))
}

function getWeatherSnapshot(circuit: CircuitDto | undefined, sequenceType: SequenceType) {
  const raceWeekend = ["Clear skies, 27°C", "High cloud, 23°C", "Variable breeze, 21°C", "Light rain risk, 19°C"]
  const testing = ["Overcast, 22°C", "Dry running, 24°C", "Mixed conditions, 20°C", "Windy and cool, 18°C"]
  const source = circuit?.id ?? circuit?.name ?? "track"
  const options = sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? raceWeekend : testing
  return options[hashLabel(`${source}-${sequenceType}`) % options.length]
}

function getSequenceTypeLabel(sequenceType: SequenceType) {
  return sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? "Race weekend" : "Test session"
}

function mapCarConfig(config?: CarConfigDto | null): CarConfigDto {
  return { ...DEFAULT_CAR_CONFIGURATION, ...Object.fromEntries(Object.entries(config ?? {}).filter(([, v]) => v != null)) }
}

function getErrorMessage(error: unknown, fallback: string) {
  const response = error as { response?: { data?: { message?: string } }; message?: string }
  return response?.response?.data?.message ?? response?.message ?? fallback
}

/** Deterministic closed-loop outline so every circuit gets its own recognisable silhouette. */
function trackPath(seed: number) {
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
  const f = (n: number) => n.toFixed(1)
  const start = mid(pts[n - 1], pts[0])
  let d = `M ${f(start[0])} ${f(start[1])}`
  for (let i = 0; i < n; i++) {
    const c = pts[i]
    const m = mid(pts[i], pts[(i + 1) % n])
    d += ` Q ${f(c[0])} ${f(c[1])} ${f(m[0])} ${f(m[1])}`
  }
  return d + " Z"
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function RaceSequenceSetup() {
  const [form, setForm] = useState<RaceSequenceFormState>(createEmptyForm)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")

  const activeSequenceQuery = useGetActiveSequence()
  const driversQuery = useGetDrivers()
  const circuitsQuery = useGetCircuits()
  const carsQuery = useGetCars()
  const saveSequenceMutation = useSaveOrUpdateSequence()
  const initiateSequenceMutation = useInitiateSequence()

  const activeSequence = activeSequenceQuery.data?.result

  const drivers = useMemo(
    () => (driversQuery.data?.result ?? []).filter((d): d is DriverDto & { id: string } => Boolean(d.id)),
    [driversQuery.data?.result]
  )
  const circuits = useMemo(
    () => (circuitsQuery.data?.result ?? []).filter((c): c is CircuitDto & { id: string } => Boolean(c.id)),
    [circuitsQuery.data?.result]
  )
  const cars = useMemo(
    () => (carsQuery.data?.result ?? []).filter((c): c is CarDto & { id: string } => Boolean(c.id)),
    [carsQuery.data?.result]
  )

  const effectiveDriverId = form.driverId || activeSequence?.driverId || getFirstAvailableId(drivers)
  const effectiveCircuitId = form.circuitId || activeSequence?.circuitId || getFirstAvailableId(circuits)
  const effectiveCarId = form.carId || activeSequence?.carId || getFirstAvailableId(cars)
  const sequenceType = form.sequenceType

  const selectedDriver = drivers.find((d) => d.id === effectiveDriverId)
  const selectedCircuit = circuits.find((c) => c.id === effectiveCircuitId)
  const selectedCar = cars.find((c) => c.id === effectiveCarId)

  const suggestedLapCount = selectedCircuit
    ? getSuggestedLapCount(selectedCircuit, sequenceType)
    : (activeSequence?.defaultLapCount ?? 0)
  const forecast =
    form.weatherInfo ||
    activeSequence?.weatherInfo ||
    (selectedCircuit ? getWeatherSnapshot(selectedCircuit, sequenceType) : "")
  const lapCount = form.customLapCount || suggestedLapCount

  const driverLabel =
    selectedDriver?.fullName || activeSequence?.driverName || selectedDriver?.acronym || "Not chosen"
  const circuitLabel = selectedCircuit?.name || activeSequence?.circuitName || "Not chosen"
  const carLabel = selectedCar?.name || activeSequence?.carName || "Not chosen"

  const setupDone = Boolean(
    form.customCarSetup.engineName ||
      form.customCarSetup.engineType ||
      form.customCarSetup.enginePower ||
      activeSequence?.carSetupSnapshot?.engineName
  )

  const steps = [
    { id: "session", label: "Session", done: Boolean(sequenceType), required: true },
    { id: "driver", label: "Driver", done: Boolean(effectiveDriverId), required: true },
    { id: "circuit", label: "Circuit", done: Boolean(effectiveCircuitId), required: true },
    { id: "car", label: "Car", done: Boolean(effectiveCarId), required: true },
    { id: "tyres", label: "Tyres", done: form.selectedCompounds.length > 0, required: true },
    { id: "setup", label: "Car setup", done: setupDone, required: false },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const missing = steps.filter((s) => s.required && !s.done).map((s) => s.label.toLowerCase())

  const toggleCompound = (compound: Compound) =>
    setForm((current) => {
      const selected = current.selectedCompounds.includes(compound)
      if (selected && current.selectedCompounds.length === 1) return current
      return {
        ...current,
        selectedCompounds: selected
          ? current.selectedCompounds.filter((c) => c !== compound)
          : [...current.selectedCompounds, compound],
      }
    })

  const updateSetup = (key: keyof CarConfigDto, value: string | number) =>
    setForm((current) => ({ ...current, customCarSetup: { ...current.customCarSetup, [key]: value } }))

  const loadCarDefaults = () => {
    if (!selectedCar) return
    setForm((current) => ({ ...current, customCarSetup: mapCarConfig(selectedCar.configuration) }))
  }

  const buildPayload = (): RaceSequenceSaveRequest => ({
    id: activeSequence?.id,
    sequenceType,
    driverId: effectiveDriverId,
    circuitId: effectiveCircuitId,
    carId: effectiveCarId,
    selectedCompounds: form.selectedCompounds,
    customLapCount: Math.max(1, Number(form.customLapCount) || suggestedLapCount || 1),
    weatherInfo: forecast || undefined,
    customCarSetup: form.customCarSetup,
  })

  const saveDraft = async () => {
    setError("")
    setFeedback("")
    try {
      const response = await saveSequenceMutation.mutateAsync({ data: buildPayload() })
      await activeSequenceQuery.refetch()
      setFeedback(response?.message || "Draft saved. You can initiate it later.")
    } catch (e) {
      setError(getErrorMessage(e, "Couldn’t save the sequence. Check your connection and try again."))
    }
  }

  const initiateSequence = async () => {
    setError("")
    setFeedback("")
    try {
      const saved = await saveSequenceMutation.mutateAsync({ data: buildPayload() })
      const sequenceId = saved?.result?.id
      if (!sequenceId) throw new Error("The saved sequence didn’t return an identifier.")
      await initiateSequenceMutation.mutateAsync({ id: sequenceId })
      await activeSequenceQuery.refetch()
      setFeedback("Sequence initiated. It’s ready on the pit wall.")
    } catch (e) {
      setError(getErrorMessage(e, "Couldn’t initiate the sequence. Check your selections and try again."))
    }
  }

  const isSubmitting = saveSequenceMutation.isPending || initiateSequenceMutation.isPending
  const canSubmit = missing.length === 0

  return (
    <div className="flex-1 bg-background">
      {/* Page header */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Race sequence</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Pick the driver, circuit, car and tyres once. The pit wall runs strategy from this sheet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40" aria-hidden>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${(doneCount / steps.length) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {doneCount} of {steps.length} done
            </span>
            <Badge variant="outline" className="rounded-md px-2.5 py-1">
              {activeSequence ? (activeSequence.status ?? "Planned") : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[168px_minmax(0,1fr)] xl:grid-cols-[168px_minmax(0,1fr)_380px]">
        {/* Step rail */}
        <nav aria-label="Sequence steps" className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <ol className="relative space-y-1 border-l border-border/60">
            {steps.map((step, i) => (
              <li key={step.id}>
                <a
                  href={`#${step.id}`}
                  className="group -ml-px flex items-center gap-3 border-l-2 border-transparent py-2 pl-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                      step.done ? "bg-primary text-primary-foreground" : "border border-border"
                    )}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  {step.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Steps */}
        <main className="min-w-0">
          {activeSequence && (
            <p className="mb-8 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              You’re editing the current sequence ({activeSequence.circuitName ?? "no circuit"}). Saving updates it.
            </p>
          )}

          <Section id="session" step={1} title="Session type" hint="Sets the race distance used for the suggested lap count." done={steps[0].done}>
            <div className="grid gap-3 sm:grid-cols-2">
              {([RaceSequenceSaveRequestSequenceType.RACE_WEEKEND, RaceSequenceSaveRequestSequenceType.TESTING] as const).map(
                (type) => (
                  <Option key={type} selected={sequenceType === type} onClick={() => setForm((c) => ({ ...c, sequenceType: type }))}>
                    <p className="font-heading text-lg font-semibold">{getSequenceTypeLabel(type)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {type === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND
                        ? "Full distance with qualifying, strategy and pit work."
                        : "Shorter runs for shakedowns, telemetry checks and setup tests."}
                    </p>
                  </Option>
                )
              )}
            </div>
          </Section>

          <Section id="driver" step={2} title="Driver" hint="Who is in the car for this sequence." done={steps[1].done}>
            <OptionGrid
              loading={driversQuery.isLoading}
              empty={drivers.length === 0}
              emptyText="No drivers yet. Add one under Asset Management."
              className="sm:grid-cols-2 2xl:grid-cols-3"
            >
              {drivers.map((driver) => (
                <Option
                  key={driver.id}
                  selected={driver.id === effectiveDriverId}
                  onClick={() => setForm((c) => ({ ...c, driverId: driver.id }))}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-heading w-12 text-right text-3xl font-bold tabular-nums leading-none text-foreground/90">
                      {driver.driverNumber ?? "–"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {driver.fullName || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || "Unnamed driver"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {driver.acronym ?? "---"}
                        {driver.countryCode ? `, ${driver.countryCode}` : ""}
                      </p>
                    </div>
                  </div>
                </Option>
              ))}
            </OptionGrid>
          </Section>

          <Section id="circuit" step={3} title="Circuit" hint="Lap count and the forecast start from the circuit you pick." done={steps[2].done}>
            <OptionGrid
              loading={circuitsQuery.isLoading}
              empty={circuits.length === 0}
              emptyText="No circuits yet. Add one under Asset Management."
              className="sm:grid-cols-2"
            >
              {circuits.map((circuit) => {
                const selected = circuit.id === effectiveCircuitId
                return (
                  <Option key={circuit.id} selected={selected} onClick={() => setForm((c) => ({ ...c, circuitId: circuit.id }))}>
                    <div className="flex items-center gap-4">
                      <TrackGlyph
                        seed={seedOf(circuit.id)}
                        className={cn("h-16 w-20 shrink-0", selected ? "text-primary" : "text-muted-foreground/60")}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-heading text-lg font-semibold leading-tight">
                          {circuit.name ?? "Unnamed circuit"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {[circuit.city, circuit.country].filter(Boolean).join(", ") || "Location unknown"}
                        </p>
                        <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                          {circuit.length ? `${circuit.length.toFixed(1)} km` : "Length pending"}
                          {" · "}
                          {circuit.numberOfCorners ?? "–"} corners
                          {" · "}
                          about {getSuggestedLapCount(circuit, sequenceType)} laps
                        </p>
                      </div>
                    </div>
                  </Option>
                )
              })}
            </OptionGrid>

            {selectedCircuit && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Race laps" hint={`Suggested: ${suggestedLapCount}`}>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder={String(suggestedLapCount)}
                    value={form.customLapCount || ""}
                    onChange={(e) => setForm((c) => ({ ...c, customLapCount: Number(e.target.value) || 0 }))}
                    className="h-10 tabular-nums"
                  />
                </Field>
                <Field label="Forecast" hint="Estimated from the circuit. Overwrite with the latest briefing.">
                  <Input
                    placeholder={getWeatherSnapshot(selectedCircuit, sequenceType)}
                    value={form.weatherInfo}
                    onChange={(e) => setForm((c) => ({ ...c, weatherInfo: e.target.value }))}
                    className="h-10"
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section id="car" step={4} title="Car" hint="The chassis that runs this sequence." done={steps[3].done}>
            <OptionGrid
              loading={carsQuery.isLoading}
              empty={cars.length === 0}
              emptyText="No cars yet. Add one under Asset Management."
              className="sm:grid-cols-2 2xl:grid-cols-3"
            >
              {cars.map((car) => (
                <Option key={car.id} selected={car.id === effectiveCarId} onClick={() => setForm((c) => ({ ...c, carId: car.id }))}>
                  <div className="flex items-start gap-3">
                    <Car className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{car.name ?? "Unnamed car"}</p>
                      <p className="text-sm text-muted-foreground">
                        #{car.carNumber ?? "–"}
                        {car.location ? `, ${car.location}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {car.status ?? "Status unknown"}
                        {car.inResearch ? ", in research" : ""}
                        {car.configuration?.maxSpeed ? `, ${car.configuration.maxSpeed} km/h top speed` : ""}
                      </p>
                    </div>
                  </div>
                </Option>
              ))}
            </OptionGrid>
          </Section>

          <Section id="tyres" step={5} title="Tyre compounds" hint="Choose every compound the strategy may use. At least one." done={steps[4].done}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {COMPOUND_OPTIONS.map((compound) => {
                const selected = form.selectedCompounds.includes(compound)
                return (
                  <button
                    key={compound}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCompound(compound)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border px-3 py-5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                      selected ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30 hover:bg-muted/40"
                    )}
                  >
                    <Tyre compound={compound} size={56} dim={!selected} />
                    <span>
                      <span className="block font-medium">{compound}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{COMPOUND_STYLE[compound].note}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section
            id="setup"
            step={6}
            title="Car setup"
            hint="Optional. Start from the car’s defaults, then adjust."
            done={steps[5].done}
            aside={
              <Button type="button" variant="outline" size="sm" onClick={loadCarDefaults} disabled={!selectedCar} className="gap-2">
                <RefreshCcw className="h-3.5 w-3.5" />
                Load car defaults
              </Button>
            }
          >
            <div className="space-y-6">
              {SETUP_GROUPS.map((group) => (
                <fieldset key={group.title} className="grid gap-4 sm:grid-cols-3">
                  <legend className="mb-3 text-sm font-semibold">{group.title}</legend>
                  {group.fields.map((f) => (
                    <Field key={f.key} label={f.label}>
                      <div className="relative">
                        <Input
                          type={f.numeric ? "number" : "text"}
                          value={
                            f.numeric
                              ? form.customCarSetup[f.key] || ""
                              : String(form.customCarSetup[f.key] ?? "")
                          }
                          placeholder={f.numeric ? "0" : undefined}
                          onChange={(e) => updateSetup(f.key, f.numeric ? Number(e.target.value) || 0 : e.target.value)}
                          className={cn("h-10", f.numeric && "tabular-nums", f.unit && "pr-14")}
                        />
                        {f.unit && (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {f.unit}
                          </span>
                        )}
                      </div>
                    </Field>
                  ))}
                </fieldset>
              ))}
            </div>
          </Section>
        </main>

        {/* Briefing */}
        <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-20 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent px-6 pb-5 pt-6">
              <p className="text-sm text-muted-foreground">{getSequenceTypeLabel(sequenceType)}</p>
              <p className="mt-1 font-heading text-2xl font-semibold leading-tight">{circuitLabel}</p>
              <TrackGlyph
                seed={seedOf(selectedCircuit?.id ?? "empty")}
                className={cn("mt-4 h-32 w-full", selectedCircuit ? "text-primary" : "text-muted-foreground/30")}
                thick
              />
            </div>

            <dl className="divide-y divide-border/60 text-sm">
              <BriefRow label="Driver">
                <span className="flex items-baseline gap-2">
                  {selectedDriver?.driverNumber != null && (
                    <span className="font-heading text-lg font-bold tabular-nums">{selectedDriver.driverNumber}</span>
                  )}
                  {driverLabel}
                </span>
              </BriefRow>
              <BriefRow label="Car">{carLabel}</BriefRow>
              <BriefRow label="Tyres">
                <span className="flex gap-1.5">
                  {form.selectedCompounds.map((c) => (
                    <Tyre key={c} compound={c as Compound} size={26} />
                  ))}
                </span>
              </BriefRow>
              <BriefRow label="Laps">
                <span className="tabular-nums">{lapCount || "–"}</span>
              </BriefRow>
              <BriefRow label="Forecast">{forecast || "Pick a circuit"}</BriefRow>
            </dl>

            <div className="space-y-3 border-t border-border/60 p-5">
              <p className="text-sm text-muted-foreground">
                {canSubmit ? "Everything required is set." : `Still needed: ${missing.join(", ")}.`}
              </p>
              <Button
                type="button"
                size="lg"
                className="h-11 w-full gap-2"
                onClick={initiateSequence}
                disabled={!canSubmit || isSubmitting}
              >
                {initiateSequenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Initiate sequence
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-2"
                onClick={saveDraft}
                disabled={!canSubmit || isSubmitting}
              >
                {saveSequenceMutation.isPending && !initiateSequenceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save draft
              </Button>

              <div aria-live="polite">
                {feedback && (
                  <p className="flex items-start gap-2 rounded-lg bg-green-500/10 px-3 py-2.5 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {feedback}
                  </p>
                )}
                {error && (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

function Section({
  id,
  step,
  title,
  hint,
  done,
  aside,
  children,
}: {
  id: string
  step: number
  title: string
  hint: string
  done: boolean
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border/60 py-9 first:border-t-0 first:pt-0">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span
            className={cn(
              "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
              done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            )}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : step}
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{title}</h2>
            <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{hint}</p>
          </div>
        </div>
        {aside}
      </header>
      <div className="md:pl-10">{children}</div>
    </section>
  )
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        selected ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30 hover:bg-muted/40"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      {children}
    </button>
  )
}

function OptionGrid({
  loading,
  empty,
  emptyText,
  className,
  children,
}: {
  loading: boolean
  empty: boolean
  emptyText: string
  className?: string
  children: ReactNode
}) {
  if (loading) {
    return (
      <div className={cn("grid gap-3", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    )
  }
  if (empty) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    )
  }
  return <div className={cn("grid gap-3", className)}>{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid content-start gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  )
}

/** Tyre drawn the way pit crews read it: coloured sidewall ring, dark tread. */
function Tyre({ compound, size = 44, dim = false }: { compound: Compound; size?: number; dim?: boolean }) {
  const s = COMPOUND_STYLE[compound]
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

function TrackGlyph({ seed, className, thick = false }: { seed: number; className?: string; thick?: boolean }) {
  const d = useMemo(() => trackPath(seed), [seed])
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeOpacity={0.25} strokeWidth={thick ? 9 : 8} strokeLinejoin="round" />
      <path d={d} stroke="currentColor" strokeWidth={thick ? 2.5 : 3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}