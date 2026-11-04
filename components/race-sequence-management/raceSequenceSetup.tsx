"use client"

import { useMemo, useState, type ElementType } from "react"
import {
  Car,
  CheckCircle2,
  CloudRain,
  Flag,
  Gauge,
  Map,
  Play,
  RefreshCcw,
  SlidersHorizontal,
  SunMedium,
  Timer,
  Users,
  Sparkles,
  Zap,
  Trophy,
  Settings2,
} from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const COMPOUND_OPTIONS = ["Soft", "Medium", "Hard", "Wet", "Inters"] as const

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

type Compound = (typeof COMPOUND_OPTIONS)[number]

type RaceSequenceFormState = {
  sequenceType: RaceSequenceSaveRequestSequenceType
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

function getRaceDistance(sequenceType: RaceSequenceSaveRequestSequenceType) {
  return sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? 305 : 120
}

function getSuggestedLapCount(circuit: CircuitDto | undefined, sequenceType: RaceSequenceSaveRequestSequenceType) {
  const trackLength = circuit?.length && circuit.length > 0 ? circuit.length : 5
  return Math.max(8, Math.round(getRaceDistance(sequenceType) / trackLength))
}

function getWeatherSnapshot(circuit: CircuitDto | undefined, sequenceType: RaceSequenceSaveRequestSequenceType) {
  const raceWeekendForecasts = ["Clear skies, 27°C", "High cloud, 23°C", "Variable breeze, 21°C", "Light rain risk, 19°C"]
  const testForecasts = ["Overcast, 22°C", "Dry running, 24°C", "Mixed conditions, 20°C", "Windy and cool, 18°C"]

  const source = circuit?.id ?? circuit?.name ?? "track"
  const options = sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? raceWeekendForecasts : testForecasts
  return options[hashLabel(`${source}-${sequenceType}`) % options.length]
}

function getSequenceTypeLabel(sequenceType: RaceSequenceSaveRequestSequenceType) {
  return sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND ? "Race Weekend" : "Test Session"
}

function getCardTone(isSelected: boolean) {
  return isSelected
    ? "border-primary/70 bg-primary/8 ring-1 ring-primary/20"
    : "border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5"
}

function mapCarConfig(config?: CarConfigDto | null): CarConfigDto {
  return {
    engineName: config?.engineName ?? "",
    engineType: config?.engineType ?? "",
    enginePower: config?.enginePower ?? 0,
    transmissionType: config?.transmissionType ?? "",
    suspensionType: config?.suspensionType ?? "",
    brakeType: config?.brakeType ?? "",
    maxSpeed: config?.maxSpeed ?? 0,
    weight: config?.weight ?? 0,
    length: config?.length ?? 0,
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const response = error as { response?: { data?: { message?: string } } }
  return response?.response?.data?.message ?? fallback
}

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
    () => (driversQuery.data?.result ?? []).filter((driver): driver is DriverDto & { id: string } => Boolean(driver.id)),
    [driversQuery.data?.result]
  )
  const circuits = useMemo(
    () => (circuitsQuery.data?.result ?? []).filter((circuit): circuit is CircuitDto & { id: string } => Boolean(circuit.id)),
    [circuitsQuery.data?.result]
  )
  const cars = useMemo(
    () => (carsQuery.data?.result ?? []).filter((car): car is CarDto & { id: string } => Boolean(car.id)),
    [carsQuery.data?.result]
  )

  const effectiveDriverId = form.driverId || activeSequence?.driverId || getFirstAvailableId(drivers)
  const effectiveCircuitId = form.circuitId || activeSequence?.circuitId || getFirstAvailableId(circuits)
  const effectiveCarId = form.carId || activeSequence?.carId || getFirstAvailableId(cars)
  const effectiveSequenceType = form.sequenceType

  const selectedDriver = drivers.find((driver) => driver.id === effectiveDriverId)
  const selectedCircuit = circuits.find((circuit) => circuit.id === effectiveCircuitId)
  const selectedCar = cars.find((car) => car.id === effectiveCarId)

  const suggestedLapCount = selectedCircuit
    ? getSuggestedLapCount(selectedCircuit, effectiveSequenceType)
    : activeSequence?.defaultLapCount ?? 0
  const currentWeather =
    form.weatherInfo || activeSequence?.weatherInfo || (selectedCircuit ? getWeatherSnapshot(selectedCircuit, effectiveSequenceType) : "")

  const activeDriverLabel = selectedDriver?.fullName || activeSequence?.driverName || selectedDriver?.acronym || activeSequence?.driverId || "No driver selected"
  const activeCircuitLabel = selectedCircuit?.name || activeSequence?.circuitName || activeSequence?.circuitId || "No circuit selected"
  const activeCarLabel = selectedCar?.name || activeSequence?.carName || activeSequence?.carId || "No car selected"

  const checklist = [
    { label: "Session type", done: Boolean(effectiveSequenceType), icon: Flag },
    { label: "Driver", done: Boolean(effectiveDriverId), icon: Users },
    { label: "Circuit", done: Boolean(effectiveCircuitId), icon: Map },
    { label: "Compounds", done: form.selectedCompounds.length > 0, icon: Gauge },
    { label: "Car", done: Boolean(effectiveCarId), icon: Car },
    { label: "Car setup", done: Boolean(form.customCarSetup.engineName || form.customCarSetup.engineType || form.customCarSetup.enginePower || activeSequence?.carSetupSnapshot?.engineName), icon: Settings2 },
  ]

  const progressPercentage = Math.round((checklist.filter(item => item.done).length / checklist.length) * 100)

  const toggleCompound = (compound: Compound) => {
    setForm((current) => {
      const selected = current.selectedCompounds.includes(compound)

      if (selected && current.selectedCompounds.length === 1) {
        return current
      }

      return {
        ...current,
        selectedCompounds: selected
          ? current.selectedCompounds.filter((item) => item !== compound)
          : [...current.selectedCompounds, compound],
      }
    })
  }

  const loadCarDefaults = () => {
    if (!selectedCar) {
      return
    }

    setForm((current) => ({
      ...current,
      customCarSetup: mapCarConfig(selectedCar.configuration),
    }))
  }

  const buildPayload = (): RaceSequenceSaveRequest => ({
    id: activeSequence?.id,
    sequenceType: effectiveSequenceType,
    driverId: effectiveDriverId,
    circuitId: effectiveCircuitId,
    carId: effectiveCarId,
    selectedCompounds: form.selectedCompounds,
    customLapCount: Math.max(1, Number(form.customLapCount) || suggestedLapCount || 1),
    weatherInfo: currentWeather || undefined,
    customCarSetup: form.customCarSetup,
  })

  const saveDraft = async () => {
    setError("")
    setFeedback("")

    try {
      const response = await saveSequenceMutation.mutateAsync({ data: buildPayload() })
      await activeSequenceQuery.refetch()
      setFeedback(response?.message || "Sequence saved for later initiation.")
    } catch (sequenceError) {
      setError(getErrorMessage(sequenceError, "Unable to save the race sequence."))
    }
  }

  const initiateSequence = async () => {
    setError("")
    setFeedback("")

    try {
      const saved = await saveSequenceMutation.mutateAsync({ data: buildPayload() })
      const sequenceId = saved?.result?.id

      if (!sequenceId) {
        throw new Error("The saved sequence did not return an identifier.")
      }

      await initiateSequenceMutation.mutateAsync({ id: sequenceId })
      await activeSequenceQuery.refetch()
      setFeedback("Race sequence initiated and ready for control room review.")
    } catch (sequenceError) {
      setError(getErrorMessage(sequenceError, "Unable to initiate the race sequence."))
    }
  }

  const isSubmitting = saveSequenceMutation.isPending || initiateSequenceMutation.isPending
  const canSubmit = Boolean(effectiveDriverId && effectiveCircuitId && effectiveCarId && form.selectedCompounds.length)

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-primary/25 bg-primary/10 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Race sequence / control room</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                Build the sequence
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Configure the session type, driver, circuit, compounds, and car setup before the engineer hands the sequence off to race control.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-md border border-border bg-muted px-3 py-1.5 text-[0.65rem] text-muted-foreground">
              {activeSequence ? activeSequence.status ?? "PLANNED" : "DRAFT"}
            </Badge>
            <Badge className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.65rem] text-primary">
              {getSequenceTypeLabel(effectiveSequenceType)}
            </Badge>
            <div className="rounded-md border border-border bg-muted px-3 py-1.5 text-[0.65rem] font-semibold text-muted-foreground">
              {progressPercentage}% Complete
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          {/* Session Type Card */}
          <div>
            <Card className="rounded-lg border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Flag className="h-6 w-6 text-primary" />
                      Session Type
                    </CardTitle>
                    <CardDescription>Start by choosing whether this sequence is for a race weekend or a test session.</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                    Step 1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {([RaceSequenceSaveRequestSequenceType.RACE_WEEKEND, RaceSequenceSaveRequestSequenceType.TESTING] as const).map((sequenceType) => {
                  const selected = effectiveSequenceType === sequenceType

                  return (
                    <button
                      key={sequenceType}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          sequenceType,
                        }))
                      }
                      className={cn(
                        "relative rounded-md border p-4 text-left transition-colors",
                        getCardTone(selected),
                        selected ? "border-primary/40" : "border-border/40"
                      )}
                    >
                      {selected && (
                        <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-base font-semibold uppercase tracking-wide">
                            {getSequenceTypeLabel(sequenceType)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND
                              ? "Full race build with qualifying, strategy planning, and pit work."
                              : "Lower-pressure setup for shakedown, telemetry verification, and setup tests."}
                          </p>
                        </div>
                        {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Driver, Circuit, Car Card */}
          <div>
            <Card className="rounded-lg border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-6 w-6 text-primary" />
                      Driver, Circuit, Car
                    </CardTitle>
                    <CardDescription>Match the driver to the circuit and assign the correct chassis for the sequence.</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                    Steps 2-5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Drivers */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    Select Driver
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {drivers.length === 0 ? (
                      <div className="col-span-full rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        No drivers available yet. Create the driver assets first.
                      </div>
                    ) : (
                      drivers.map((driver) => {
                        const selected = driver.id === effectiveDriverId

                        return (
                          <button
                            key={driver.id}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, driverId: driver.id }))}
                            className={cn(
                              "relative rounded-md border p-4 text-left transition-colors",
                              getCardTone(selected),
                              selected ? "border-primary/40" : "border-border/40"
                            )}
                          >
                            {selected && (
                              <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-heading text-sm font-semibold uppercase tracking-wide">
                                  {driver.fullName || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || "Unnamed driver"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  #{driver.driverNumber ?? "--"} · {driver.acronym ?? "---"} · {driver.countryCode ?? "--"}
                                </p>
                              </div>
                              {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <Separator className="border-border/40" />

                {/* Circuits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    <Map className="h-4 w-4 text-primary" />
                    Select Circuit
                  </div>
                  <div className="grid gap-3">
                    {circuits.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        No circuits available yet. Create the circuit assets first.
                      </div>
                    ) : (
                      circuits.map((circuit) => {
                        const selected = circuit.id === effectiveCircuitId
                        const lengthLabel = circuit.length ? `${circuit.length.toFixed(1)} km` : "Track length pending"
                        const lapCount = getSuggestedLapCount(circuit, effectiveSequenceType)
                        const forecast = form.weatherInfo || getWeatherSnapshot(circuit, effectiveSequenceType)

                        return (
                          <button
                            key={circuit.id}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, circuitId: circuit.id }))}
                            className={cn(
                              "relative rounded-md border p-4 text-left transition-colors",
                              getCardTone(selected),
                              selected ? "border-primary/40" : "border-border/40"
                            )}
                          >
                            {selected && (
                              <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-heading text-sm font-semibold uppercase tracking-wide">{circuit.name ?? "Unnamed circuit"}</p>
                                  {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {circuit.country ?? "Unknown country"} · {circuit.city ?? "Unknown city"}
                                </p>
                                <p className="text-xs leading-5 text-muted-foreground">
                                  {circuit.description || "Circuit profile ready for sequence planning."}
                                </p>
                              </div>

                              <div className="grid min-w-0 gap-2 text-xs text-muted-foreground lg:text-right">
                                <div className="flex items-center gap-2 lg:justify-end">
                                  <Timer className="h-3.5 w-3.5 text-primary" />
                                  Suggested laps: {lapCount}
                                </div>
                                <div className="flex items-center gap-2 lg:justify-end">
                                  <SunMedium className="h-3.5 w-3.5 text-primary" />
                                  Forecast: {forecast}
                                </div>
                                <div className="flex items-center gap-2 lg:justify-end">
                                  <Gauge className="h-3.5 w-3.5 text-primary" />
                                  {lengthLabel}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Badge variant="outline" className="rounded-full border-border/60 text-[0.6rem]">
                                {circuit.numberOfCorners ?? "--"} corners
                              </Badge>
                              <Badge variant="outline" className="rounded-full border-border/60 text-[0.6rem]">
                                Lap record {circuit.lapRecord ?? "pending"}
                              </Badge>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {selectedCircuit && (
                    <div 
                      className={cn(
                        "rounded-md border border-primary/25 bg-primary/5 p-4"
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-foreground">
                        <SunMedium className="h-4 w-4 text-primary" />
                        Track Snapshot
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-background/50 p-3 border border-border/30">
                          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Default laps</p>
                          <p className="font-mono text-lg font-bold text-foreground">{suggestedLapCount}</p>
                        </div>
                        <div className="rounded-lg bg-background/50 p-3 border border-border/30">
                          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Weather</p>
                          <p className="font-mono text-lg font-bold text-foreground">{currentWeather}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="border-border/40" />

                {/* Cars */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    <Car className="h-4 w-4 text-primary" />
                    Select Car
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {cars.length === 0 ? (
                      <div className="col-span-full rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        No cars available yet. Create the car assets first.
                      </div>
                    ) : (
                      cars.map((car) => {
                        const selected = car.id === effectiveCarId
                        const statusLabel = car.status ?? "UNKNOWN"

                        return (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, carId: car.id }))}
                            className={cn(
                              "relative rounded-md border p-4 text-left transition-colors",
                              getCardTone(selected),
                              selected ? "border-primary/40" : "border-border/40"
                            )}
                          >
                            {selected && (
                              <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-heading text-sm font-semibold uppercase tracking-wide">{car.name ?? "Unnamed car"}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  #{car.carNumber ?? "--"} · {car.location ?? "Unknown garage"}
                                </p>
                              </div>
                              {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Badge variant="outline" className="rounded-full border-border/60 text-[0.6rem]">
                                {statusLabel}
                              </Badge>
                              <Badge variant="outline" className="rounded-full border-border/60 text-[0.6rem]">
                                {car.inResearch ? "In research" : "Production ready"}
                              </Badge>
                            </div>

                            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Gauge className="h-3.5 w-3.5 text-primary" />
                                {car.configuration?.maxSpeed ?? 0} km/h top speed
                              </div>
                              <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                                {car.configuration?.engineName || "Default setup available"}
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compound Strategy Card */}
          <div>
            <Card className="rounded-lg border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Gauge className="h-6 w-6 text-primary" />
                      Compound Strategy
                    </CardTitle>
                    <CardDescription>Select the tire compounds that will be tracked during the sequence.</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                    Step 4
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {COMPOUND_OPTIONS.map((compound) => {
                    const selected = form.selectedCompounds.includes(compound)

                    return (
                      <button
                        key={compound}
                        type="button"
                        onClick={() => toggleCompound(compound)}
                        className={cn(
                          "rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
                          selected
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/60 bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                      >
                        {compound}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    Selected compounds: <span className="font-mono font-semibold text-foreground">{form.selectedCompounds.join(", ")}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Car Configuration Card */}
          <div>
            <Card className="rounded-lg border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings2 className="h-6 w-6 text-primary" />
                      Car Configuration
                    </CardTitle>
                    <CardDescription>Load the selected car default setup and adjust the key setup values before initiation.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                      Step 6
                    </Badge>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={loadCarDefaults} 
                      className="gap-2 border-primary/30 hover:bg-primary/10"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Load Defaults
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ["engineName", "Engine name"],
                  ["engineType", "Engine type"],
                  ["transmissionType", "Transmission"],
                  ["suspensionType", "Suspension"],
                  ["brakeType", "Brake package"],
                ].map(([key, label]) => (
                  <div key={key} className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
                    <Input
                      value={String(form.customCarSetup[key as keyof CarConfigDto] ?? "")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customCarSetup: {
                            ...current.customCarSetup,
                            [key]: event.target.value,
                          },
                        }))
                      }
                      className="h-9 bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                ))}

                {[
                  ["enginePower", "Engine power"],
                  ["maxSpeed", "Max speed"],
                  ["weight", "Weight"],
                  ["length", "Length"],
                ].map(([key, label]) => (
                  <div key={key} className="grid gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
                    <Input
                      type="number"
                      value={String(form.customCarSetup[key as keyof CarConfigDto] ?? 0)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customCarSetup: {
                            ...current.customCarSetup,
                            [key]: Number(event.target.value),
                          },
                        }))
                      }
                      className="h-9 bg-muted/40 border-border/50 font-mono focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Execution Card */}
          <div>
            <Card className="rounded-lg border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-6 w-6 text-primary" />
                      Execution
                    </CardTitle>
                    <CardDescription>Save the draft or initiate the configured sequence for the selected session.</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                    Step 7
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-primary/30 hover:bg-primary/10"
                    onClick={saveDraft}
                    disabled={!canSubmit || isSubmitting}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button 
                    type="button" 
                    className="gap-2 shadow-sm"
                    onClick={initiateSequence} 
                    disabled={!canSubmit || isSubmitting}
                  >
                    <Play className="h-4 w-4" />
                    Initiate Sequence
                  </Button>
                </div>

                {!canSubmit && (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Complete the required selections before saving or initiating the sequence.
                  </div>
                )}

                {feedback && (
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                    {feedback}
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div>
            <Card className="rounded-lg border-primary/30 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-6 w-6 text-primary" />
                  Sequence Summary
                </CardTitle>
                <CardDescription>The race engineer sees the current build state at a glance before handoff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <SummaryRow label="Session" value={getSequenceTypeLabel(effectiveSequenceType)} icon={Flag} />
                  <SummaryRow label="Driver" value={activeDriverLabel} icon={Users} />
                  <SummaryRow label="Circuit" value={activeCircuitLabel} icon={Map} />
                  <SummaryRow label="Car" value={activeCarLabel} icon={Car} />
                  <SummaryRow label="Compounds" value={form.selectedCompounds.join(", ")} icon={Gauge} />
                  <SummaryRow label="Suggested laps" value={String(suggestedLapCount || form.customLapCount || "--")} icon={Timer} />
                </div>

                <Separator className="border-border/40" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Progress
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm transition-all duration-200 hover:bg-primary/5">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5 text-primary/60" />
                          {item.label}
                        </span>
                        <span className={cn("text-xs font-semibold uppercase tracking-widest", item.done ? "text-primary" : "text-muted-foreground")}>
                          {item.done ? "Ready" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">{progressPercentage}% Complete</p>
                </div>

                <Separator className="border-border/40" />

                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-muted-foreground">
                    <CloudRain className="h-4 w-4 text-primary" />
                    Weather Snapshot
                  </div>
                  <p className="mt-2 font-mono text-lg font-bold text-foreground">{currentWeather || "Select a circuit to load the weather briefing."}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lap count and weather are derived from the circuit profile so the engineer can begin with a sensible baseline.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </aside>
      </main>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string
  value: string
  icon: ElementType
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 transition-all duration-200 hover:bg-primary/5",
        compact ? "rounded-lg border border-border/40 bg-background/50 p-3" : "rounded-lg border border-border/40 bg-background/50 p-4"
      )}
    >
      <div className="rounded-lg border border-border/40 bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 wrap-break-word font-mono text-sm font-medium text-foreground">{value || "--"}</p>
      </div>
    </div>
  )
}
