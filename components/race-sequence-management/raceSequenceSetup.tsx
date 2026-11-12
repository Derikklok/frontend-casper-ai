"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Car, Check, CheckCircle2, CircleDot, Flag, Loader2, MapPin, Play, RefreshCcw, Save, Users, Wrench } from "lucide-react"

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
import { Panel } from "@/components/dashboard/widgets"
import { seedOf, trackPath, TrackGlyph, Tyre } from "@/components/race-sequence-management/visuals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Constants & pure helpers                                                  */
/* -------------------------------------------------------------------------- */

const COMPOUND_OPTIONS = ["Soft", "Medium", "Hard", "Wet", "Inters"] as const
type Compound = (typeof COMPOUND_OPTIONS)[number]

const COMPOUND_NOTE: Record<Compound, string> = {
  Soft: "Fastest, wears quickly",
  Medium: "Balanced pace and life",
  Hard: "Slowest, longest stints",
  Inters: "Damp or drying track",
  Wet: "Heavy rain",
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
    [driversQuery.data?.result],
  )
  const circuits = useMemo(
    () => (circuitsQuery.data?.result ?? []).filter((c): c is CircuitDto & { id: string } => Boolean(c.id)),
    [circuitsQuery.data?.result],
  )
  const cars = useMemo(
    () => (carsQuery.data?.result ?? []).filter((c): c is CarDto & { id: string } => Boolean(c.id)),
    [carsQuery.data?.result],
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

  const driverLabel = selectedDriver?.fullName || activeSequence?.driverName || selectedDriver?.acronym || "Not chosen"
  const circuitLabel = selectedCircuit?.name || activeSequence?.circuitName || "Not chosen"
  const carLabel = selectedCar?.name || activeSequence?.carName || "Not chosen"

  const setupDone = Boolean(
    form.customCarSetup.engineName ||
      form.customCarSetup.engineType ||
      form.customCarSetup.enginePower ||
      activeSequence?.carSetupSnapshot?.engineName,
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
  const previewPath = useMemo(() => trackPath(seedOf(selectedCircuit?.id ?? "empty")), [selectedCircuit?.id])

  return (
    <main className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 p-3 lg:p-5">
      <div className="mx-auto max-w-[2200px] space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <p className="text-[11px] font-semibold tracking-widest text-green-400 uppercase">
                Setup · {activeSequence ? "Editing active sequence" : "New draft"}
              </p>
              <Badge variant="outline" className="rounded border px-2 py-0.5 text-[10px] font-bold">
                {activeSequence ? (activeSequence.status ?? "Planned") : "Draft"}
              </Badge>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">Race Sequence</h1>
            <p className="text-xs text-muted-foreground">
              Pick the driver, circuit, car and tyres once. The pit wall runs strategy from this sheet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted/50" aria-hidden>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {doneCount}/{steps.length} READY
            </span>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Session" value={getSequenceTypeLabel(sequenceType)} tone="text-primary" />
          <Stat label="Driver" value={selectedDriver?.acronym ?? driverLabel} tone="text-cyan-400" />
          <Stat label="Circuit" value={circuitLabel} />
          <Stat label="Car" value={carLabel} tone="text-amber-400" />
          <Stat label="Laps" value={lapCount || "–"} tone="text-blue-400" />
          <Stat label="Forecast" value={forecast || "–"} />
        </div>

        {/* Step chips */}
        <nav aria-label="Sequence steps" className="flex flex-wrap gap-1.5">
          {steps.map((step, i) => (
            <a
              key={step.id}
              href={`#${step.id}`}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 font-quicksand text-[11px] font-semibold tracking-widest uppercase transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                step.done
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background/60 text-[10px] tabular-nums">
                {step.done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              {step.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Steps */}
          <div className="min-w-0 space-y-3">
            <Step id="session" title="01 · Session type" icon={<Flag className="h-3.5 w-3.5" />} done={steps[0].done}>
              <div className="grid gap-2 sm:grid-cols-2">
                {([RaceSequenceSaveRequestSequenceType.RACE_WEEKEND, RaceSequenceSaveRequestSequenceType.TESTING] as const).map((type) => (
                  <Option key={type} selected={sequenceType === type} onClick={() => setForm((c) => ({ ...c, sequenceType: type }))}>
                    <p className="font-heading text-base font-semibold">{getSequenceTypeLabel(type)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {type === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND
                        ? "Full distance with qualifying, strategy and pit work."
                        : "Shorter runs for shakedowns, telemetry checks and setup tests."}
                    </p>
                  </Option>
                ))}
              </div>
              <Hint>Sets the race distance used for the suggested lap count.</Hint>
            </Step>

            <Step id="driver" title="02 · Driver" icon={<Users className="h-3.5 w-3.5" />} done={steps[1].done} count={drivers.length}>
              <OptionGrid loading={driversQuery.isLoading} empty={drivers.length === 0} emptyText="No drivers yet. Add one under Asset Management." className="sm:grid-cols-2 2xl:grid-cols-3">
                {drivers.map((driver) => (
                  <Option key={driver.id} selected={driver.id === effectiveDriverId} onClick={() => setForm((c) => ({ ...c, driverId: driver.id }))}>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right font-heading text-2xl leading-none font-bold text-primary tabular-nums">
                        {driver.driverNumber ?? "–"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {driver.fullName || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || "Unnamed driver"}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {driver.acronym ?? "---"}
                          {driver.countryCode ? ` • ${driver.countryCode}` : ""}
                        </p>
                      </div>
                    </div>
                  </Option>
                ))}
              </OptionGrid>
            </Step>

            <Step id="circuit" title="03 · Circuit" icon={<MapPin className="h-3.5 w-3.5" />} done={steps[2].done} count={circuits.length}>
              <OptionGrid loading={circuitsQuery.isLoading} empty={circuits.length === 0} emptyText="No circuits yet. Add one under Asset Management." className="sm:grid-cols-2">
                {circuits.map((circuit) => {
                  const selected = circuit.id === effectiveCircuitId
                  return (
                    <Option key={circuit.id} selected={selected} onClick={() => setForm((c) => ({ ...c, circuitId: circuit.id }))}>
                      <div className="flex items-center gap-3">
                        <TrackGlyph seed={seedOf(circuit.id)} className={cn("h-14 w-[4.5rem] shrink-0", selected ? "text-primary" : "text-muted-foreground/60")} />
                        <div className="min-w-0">
                          <p className="truncate font-heading text-base leading-tight font-semibold">{circuit.name ?? "Unnamed circuit"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[circuit.city, circuit.country].filter(Boolean).join(", ") || "Location unknown"}
                          </p>
                          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                            {circuit.length ? `${circuit.length.toFixed(1)} km` : "– km"} · {circuit.numberOfCorners ?? "–"} T · ~{getSuggestedLapCount(circuit, sequenceType)} laps
                          </p>
                        </div>
                      </div>
                    </Option>
                  )
                })}
              </OptionGrid>

              {selectedCircuit && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Race laps" hint={`Suggested: ${suggestedLapCount}`}>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder={String(suggestedLapCount)}
                      value={form.customLapCount || ""}
                      onChange={(e) => setForm((c) => ({ ...c, customLapCount: Number(e.target.value) || 0 }))}
                      className="h-9 font-mono tabular-nums"
                    />
                  </Field>
                  <Field label="Forecast" hint="Estimated from the circuit. Overwrite with the latest briefing.">
                    <Input
                      placeholder={getWeatherSnapshot(selectedCircuit, sequenceType)}
                      value={form.weatherInfo}
                      onChange={(e) => setForm((c) => ({ ...c, weatherInfo: e.target.value }))}
                      className="h-9"
                    />
                  </Field>
                </div>
              )}
            </Step>

            <Step id="car" title="04 · Car" icon={<Car className="h-3.5 w-3.5" />} done={steps[3].done} count={cars.length}>
              <OptionGrid loading={carsQuery.isLoading} empty={cars.length === 0} emptyText="No cars yet. Add one under Asset Management." className="sm:grid-cols-2 2xl:grid-cols-3">
                {cars.map((car) => (
                  <Option key={car.id} selected={car.id === effectiveCarId} onClick={() => setForm((c) => ({ ...c, carId: car.id }))}>
                    <div className="flex items-start gap-3">
                      <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{car.name ?? "Unnamed car"}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          #{car.carNumber ?? "–"}
                          {car.location ? ` • ${car.location}` : ""}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {car.status ?? "Status unknown"}
                          {car.inResearch ? ", in research" : ""}
                          {car.configuration?.maxSpeed ? `, ${car.configuration.maxSpeed} km/h top speed` : ""}
                        </p>
                      </div>
                    </div>
                  </Option>
                ))}
              </OptionGrid>
            </Step>

            <Step id="tyres" title="05 · Tyre compounds" icon={<CircleDot className="h-3.5 w-3.5" />} done={steps[4].done} count={form.selectedCompounds.length}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {COMPOUND_OPTIONS.map((compound) => {
                  const selected = form.selectedCompounds.includes(compound)
                  return (
                    <button
                      key={compound}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleCompound(compound)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        selected ? "border-primary bg-primary/15 ring-1 ring-primary/40" : "border-border/50 bg-muted/20 hover:bg-muted/50",
                      )}
                    >
                      <Tyre compound={compound} size={48} dim={!selected} />
                      <span>
                        <span className="block text-sm font-semibold">{compound}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{COMPOUND_NOTE[compound]}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <Hint>Choose every compound the strategy may use. At least one.</Hint>
            </Step>

            <Step
              id="setup"
              title="06 · Car setup (optional)"
              icon={<Wrench className="h-3.5 w-3.5" />}
              done={steps[5].done}
              aside={
                <Button type="button" variant="outline" size="sm" onClick={loadCarDefaults} disabled={!selectedCar} className="h-7 gap-1.5 text-xs">
                  <RefreshCcw className="h-3 w-3" />
                  Load car defaults
                </Button>
              }
            >
              <div className="space-y-4">
                {SETUP_GROUPS.map((group) => (
                  <fieldset key={group.title} className="grid gap-3 sm:grid-cols-3">
                    <legend className="mb-2 font-quicksand text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{group.title}</legend>
                    {group.fields.map((f) => (
                      <Field key={f.key} label={f.label}>
                        <div className="relative">
                          <Input
                            type={f.numeric ? "number" : "text"}
                            value={f.numeric ? form.customCarSetup[f.key] || "" : String(form.customCarSetup[f.key] ?? "")}
                            placeholder={f.numeric ? "0" : undefined}
                            onChange={(e) => updateSetup(f.key, f.numeric ? Number(e.target.value) || 0 : e.target.value)}
                            className={cn("h-9", f.numeric && "font-mono tabular-nums", f.unit && "pr-14")}
                          />
                          {f.unit && (
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-muted-foreground">{f.unit}</span>
                          )}
                        </div>
                      </Field>
                    ))}
                  </fieldset>
                ))}
              </div>
            </Step>
          </div>

          {/* Briefing */}
          <aside className="xl:sticky xl:top-20 xl:self-start">
            <Panel title="Sequence Briefing" icon={<Flag className="h-3.5 w-3.5" />} right={<span className="font-mono text-[10px] text-muted-foreground">{getSequenceTypeLabel(sequenceType).toUpperCase()}</span>}>
              <div className="-m-3">
                <div className="border-b border-border/40 bg-gradient-to-b from-primary/10 to-transparent px-4 pt-4 pb-2">
                  <p className="truncate font-heading text-xl leading-tight font-semibold">{circuitLabel}</p>
                  <svg viewBox="0 0 100 100" fill="none" className={cn("mt-2 h-40 w-full", selectedCircuit ? "text-primary" : "text-muted-foreground/30")} aria-hidden>
                    <path d={previewPath} stroke="currentColor" strokeOpacity={0.12} strokeWidth={9} strokeLinejoin="round" />
                    <path d={previewPath} stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.8} strokeLinejoin="round" />
                    {selectedCircuit && (
                      <circle r={3.2} fill="currentColor">
                        <animateMotion dur="8s" repeatCount="indefinite" path={previewPath} />
                      </circle>
                    )}
                  </svg>
                </div>

                <dl className="divide-y divide-border/40 text-sm">
                  <BriefRow label="Driver">
                    <span className="flex items-baseline gap-2">
                      {selectedDriver?.driverNumber != null && (
                        <span className="font-heading text-base font-bold text-primary tabular-nums">{selectedDriver.driverNumber}</span>
                      )}
                      {driverLabel}
                    </span>
                  </BriefRow>
                  <BriefRow label="Car">{carLabel}</BriefRow>
                  <BriefRow label="Tyres">
                    <span className="flex gap-1.5">
                      {form.selectedCompounds.map((c) => (
                        <Tyre key={c} compound={c} size={24} />
                      ))}
                    </span>
                  </BriefRow>
                  <BriefRow label="Laps">
                    <span className="font-mono tabular-nums">{lapCount || "–"}</span>
                  </BriefRow>
                  <BriefRow label="Forecast">{forecast || "Pick a circuit"}</BriefRow>
                </dl>

                <div className="space-y-2.5 border-t border-border/40 p-4">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {canSubmit ? "ALL REQUIRED INPUTS SET" : `STILL NEEDED: ${missing.join(", ").toUpperCase()}`}
                  </p>
                  <Button type="button" size="lg" className="h-10 w-full gap-2" onClick={initiateSequence} disabled={!canSubmit || isSubmitting}>
                    {initiateSequenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Initiate sequence
                  </Button>
                  <Button type="button" variant="outline" className="h-9 w-full gap-2" onClick={saveDraft} disabled={!canSubmit || isSubmitting}>
                    {saveSequenceMutation.isPending && !initiateSequenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save draft
                  </Button>

                  <div aria-live="polite" className="space-y-2">
                    {feedback && (
                      <p className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {feedback}
                      </p>
                    )}
                    {error && (
                      <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={cn("truncate font-mono text-sm font-bold tabular-nums", tone)}>{value}</p>
    </div>
  )
}

function Step({
  id,
  title,
  icon,
  done,
  count,
  aside,
  children,
}: {
  id: string
  title: string
  icon: ReactNode
  done: boolean
  count?: number
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-20">
      <Panel
        title={title}
        icon={icon}
        right={
          <span className="flex items-center gap-2">
            {aside}
            {count != null && <span className="font-mono text-[10px] text-muted-foreground">{count}</span>}
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                done ? "bg-primary text-primary-foreground" : "border border-border/60 text-transparent",
              )}
              aria-label={done ? "Step complete" : "Step incomplete"}
            >
              <Check className="h-3 w-3" />
            </span>
          </span>
        }
      >
        {children}
      </Panel>
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[11px] text-muted-foreground">{children}</p>
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        selected ? "border-primary bg-primary/15 ring-1 ring-primary/40" : "border-border/50 bg-muted/20 hover:bg-muted/50",
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" />
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
      <div className={cn("grid gap-2", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    )
  }
  if (empty) {
    return (
      <p className="rounded-lg border border-dashed border-border/40 px-4 py-8 text-center text-xs text-muted-foreground">{emptyText}</p>
    )
  }
  return <div className={cn("grid max-h-[26rem] gap-2 overflow-y-auto pr-1", className)}>{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid content-start gap-1.5">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium">{children}</dd>
    </div>
  )
}