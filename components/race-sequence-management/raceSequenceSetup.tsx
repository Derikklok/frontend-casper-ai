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
    ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    : "border-border/70 bg-background hover:border-border hover:bg-muted/30"
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
    { label: "Session type", done: Boolean(effectiveSequenceType) },
    { label: "Driver", done: Boolean(effectiveDriverId) },
    { label: "Circuit", done: Boolean(effectiveCircuitId) },
    { label: "Compounds", done: form.selectedCompounds.length > 0 },
    { label: "Car", done: Boolean(effectiveCarId) },
    { label: "Car setup", done: Boolean(form.customCarSetup.engineName || form.customCarSetup.engineType || form.customCarSetup.enginePower || activeSequence?.carSetupSnapshot?.engineName) },
  ]

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-muted/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_34%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Flag className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">Race Sequence Dashboard</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Prepare the next race weekend</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Configure the session type, driver, circuit, compounds, and car setup before the engineer hands the sequence off to race control.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[0.65rem] text-muted-foreground">
              {activeSequence ? activeSequence.status ?? "PLANNED" : "DRAFT"}
            </Badge>
            <Badge className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] text-primary">
              {getSequenceTypeLabel(effectiveSequenceType)}
            </Badge>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1.6fr)_380px]">
        <section className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Session Type</CardTitle>
                  <CardDescription>Start by choosing whether this sequence is for a race weekend or a test session.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
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
                    className={cn("rounded-none border p-4 text-left transition-all", getCardTone(selected))}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-heading text-base font-semibold uppercase tracking-wide">{getSequenceTypeLabel(sequenceType)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sequenceType === RaceSequenceSaveRequestSequenceType.RACE_WEEKEND
                            ? "Full race build with qualifying, strategy planning, and pit work."
                            : "Lower-pressure setup for shakedown, telemetry verification, and setup tests."}
                        </p>
                      </div>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Driver, Circuit, Car</CardTitle>
                  <CardDescription>Match the driver to the circuit and assign the correct chassis for the sequence.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                  Steps 2 to 5
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Drivers
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {drivers.length === 0 ? (
                    <div className="rounded-none border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
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
                          className={cn("rounded-none border p-4 text-left transition-all", getCardTone(selected))}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-heading text-sm font-semibold uppercase tracking-wide">
                                {driver.fullName || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || "Unnamed driver"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                #{driver.driverNumber ?? "--"} · {driver.acronym ?? "---"} · {driver.countryCode ?? "--"}
                              </p>
                            </div>
                            {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Map className="h-4 w-4" />
                  Circuits
                </div>
                <div className="grid gap-3">
                  {circuits.length === 0 ? (
                    <div className="rounded-none border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
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
                          className={cn("rounded-none border p-4 text-left transition-all", getCardTone(selected))}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="font-heading text-sm font-semibold uppercase tracking-wide">{circuit.name ?? "Unnamed circuit"}</p>
                                {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
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
                                <Timer className="h-3.5 w-3.5" />
                                Suggested laps: {lapCount}
                              </div>
                              <div className="flex items-center gap-2 lg:justify-end">
                                <SunMedium className="h-3.5 w-3.5" />
                                Forecast: {forecast}
                              </div>
                              <div className="flex items-center gap-2 lg:justify-end">
                                <Gauge className="h-3.5 w-3.5" />
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
                  <div className="rounded-none border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-foreground">
                      <SunMedium className="h-4 w-4 text-primary" />
                      Track snapshot
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Default laps</p>
                        <p className="font-mono text-sm text-foreground">{suggestedLapCount}</p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Weather</p>
                        <p className="font-mono text-sm text-foreground">{currentWeather}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Car className="h-4 w-4" />
                  Cars
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {cars.length === 0 ? (
                    <div className="rounded-none border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
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
                          className={cn("rounded-none border p-4 text-left transition-all", getCardTone(selected))}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-heading text-sm font-semibold uppercase tracking-wide">{car.name ?? "Unnamed car"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                #{car.carNumber ?? "--"} · {car.location ?? "Unknown garage"}
                              </p>
                            </div>
                            {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
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
                              <Gauge className="h-3.5 w-3.5" />
                              {car.configuration?.maxSpeed ?? 0} km/h top speed
                            </div>
                            <div className="flex items-center gap-2">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
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

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Compound Strategy</CardTitle>
                  <CardDescription>Select the tire compounds that will be tracked during the sequence.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                  Step 4
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMPOUND_OPTIONS.map((compound) => {
                  const selected = form.selectedCompounds.includes(compound)

                  return (
                    <button
                      key={compound}
                      type="button"
                      onClick={() => toggleCompound(compound)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all",
                        selected
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {compound}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-none border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                Selected compounds: <span className="font-mono text-foreground">{form.selectedCompounds.join(", ")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Car Configuration</CardTitle>
                  <CardDescription>Load the selected car default setup and adjust the key setup values before initiation.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                    Step 6
                  </Badge>
                  <Button type="button" variant="outline" size="sm" onClick={loadCarDefaults} className="gap-2">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Load default configuration
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
                    className="h-9 bg-muted/40 border-border/50"
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
                    className="h-9 bg-muted/40 border-border/50 font-mono"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Execution</CardTitle>
                  <CardDescription>Save the draft or initiate the configured sequence for the selected session.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                  Step 7
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={saveDraft} disabled={!canSubmit || isSubmitting}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Save draft
                </Button>
                <Button type="button" className="gap-2" onClick={initiateSequence} disabled={!canSubmit || isSubmitting}>
                  <Play className="h-3.5 w-3.5" />
                  Initiate sequence
                </Button>
              </div>

              {!canSubmit && (
                <div className="rounded-none border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Complete the required selections before saving or initiating the sequence.
                </div>
              )}

              {feedback && <div className="rounded-none border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{feedback}</div>}
              {error && <div className="rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle>Sequence Summary</CardTitle>
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

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Checklist
                </div>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-none border border-border/60 bg-background/70 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={cn("text-xs font-semibold uppercase tracking-widest", item.done ? "text-primary" : "text-muted-foreground")}>
                        {item.done ? "Ready" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 rounded-none border border-border/60 bg-background/70 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold uppercase tracking-widest text-muted-foreground">
                  <CloudRain className="h-4 w-4" />
                  Weather snapshot
                </div>
                <p className="font-mono wrap-break-word text-foreground">{currentWeather || "Select a circuit to load the weather briefing."}</p>
                <p className="text-muted-foreground">
                  Lap count and weather are derived from the circuit profile so the engineer can begin with a sensible baseline.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle>Active Sequence</CardTitle>
              <CardDescription>Snapshot of the current backend sequence, if one is already planned or active.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSequenceQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Loading active sequence...
                </div>
              ) : activeSequence ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] text-primary">
                      {activeSequence.status ?? "PLANNED"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1 text-[0.65rem]">
                      {getSequenceTypeLabel(activeSequence.sequenceType ?? RaceSequenceSaveRequestSequenceType.RACE_WEEKEND)}
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <SummaryRow label="Driver" value={activeSequence.driverName ?? activeSequence.driverId ?? "Unknown"} icon={Users} compact />
                    <SummaryRow label="Circuit" value={activeSequence.circuitName ?? activeSequence.circuitId ?? "Unknown"} icon={Map} compact />
                    <SummaryRow label="Car" value={activeSequence.carName ?? activeSequence.carId ?? "Unknown"} icon={Car} compact />
                    <SummaryRow label="Default laps" value={String(activeSequence.defaultLapCount ?? "--")} icon={Timer} compact />
                    <SummaryRow label="Weather" value={activeSequence.weatherInfo ?? "Not configured"} icon={SunMedium} compact />
                  </div>

                  {activeSequence.selectedCompounds?.length ? (
                    <div className="rounded-none border border-border/60 bg-muted/20 p-4 text-sm">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Stored compounds</p>
                      <div className="flex flex-wrap gap-2">
                        {activeSequence.selectedCompounds.map((compound) => (
                          <Badge key={compound} variant="outline" className="rounded-full border-border/60 text-[0.6rem]">
                            {compound}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-none border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  No active sequence yet. Configure one from the main workflow and initiate it when ready.
                </div>
              )}
            </CardContent>
          </Card>
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
        "flex items-start gap-3",
        compact ? "rounded-none border border-border/60 bg-background/70 p-3" : "rounded-none border border-border/60 bg-background/70 p-4"
      )}
    >
      <div className="rounded-none border border-border/60 bg-muted/40 p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 wrap-break-word font-mono text-sm text-foreground">{value || "--"}</p>
      </div>
    </div>
  )
}