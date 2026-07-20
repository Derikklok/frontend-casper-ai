"use client"

import { useState } from "react"
import { useGetCars, useCreateCar } from "@/api/endpoints/asset-controller/asset-controller"
import type { CarCreateRequest } from "@/api/models"
import { CarCreateRequestStatus } from "@/api/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Car, Gauge } from "lucide-react"

const EMPTY_FORM: CarCreateRequest = {
  name: "", carNumber: 1, imageUrl: "", status: CarCreateRequestStatus.ALLOWED,
  location: "", inResearch: false,
  configuration: {
    engineName: "", engineType: "", enginePower: 0, transmissionType: "",
    suspensionType: "", brakeType: "", maxSpeed: 0, weight: 0, length: 0,
  },
}

const STATUS_COLORS: Record<string, string> = {
  ALLOWED: "bg-green-500/10 text-green-500 border-green-500/30",
  BANNED: "bg-red-500/10 text-red-500 border-red-500/30",
  TEMPORARY_BANNED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  TERMINATED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
}

export default function CarSetup() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CarCreateRequest>(EMPTY_FORM)
  const [error, setError] = useState("")

  const { data, isLoading, refetch } = useGetCars()
  const createMutation = useCreateCar()

  const cars = data?.result ?? []

  const setTop = (k: keyof Omit<CarCreateRequest, "configuration">, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const setCfg = (k: keyof CarCreateRequest["configuration"], v: string | number) =>
    setForm((f) => ({ ...f, configuration: { ...f.configuration, [k]: v } }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    createMutation.mutate(
      {
        data: {
          ...form,
          carNumber: Number(form.carNumber),
          configuration: {
            ...form.configuration,
            enginePower: Number(form.configuration.enginePower),
            maxSpeed: Number(form.configuration.maxSpeed),
            weight: Number(form.configuration.weight),
            length: Number(form.configuration.length),
          },
        },
      },
      {
        onSuccess: () => { setForm(EMPTY_FORM); setShowForm(false); refetch() },
        onError: () => setError("Failed to create car. Check all fields."),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide">Cars</h2>
          <p className="font-google-flex text-sm text-muted-foreground mt-0.5">{cars.length} registered</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Car
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base uppercase tracking-wide">New Car</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                  <Input value={form.name} onChange={(e) => setTop("name", e.target.value)}
                    className="h-9 bg-muted/40 border-border/50" required />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Car #</Label>
                  <Input type="number" value={form.carNumber} onChange={(e) => setTop("carNumber", e.target.value)}
                    className="h-9 bg-muted/40 border-border/50 font-mono" required />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
                  <Input value={form.location} onChange={(e) => setTop("location", e.target.value)}
                    className="h-9 bg-muted/40 border-border/50" required />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                  <select value={form.status}
                    onChange={(e) => setTop("status", e.target.value as CarCreateRequest["status"])}
                    className="h-9 rounded-md border border-border/50 bg-muted/40 px-3 text-sm font-mono text-foreground">
                    {Object.values(CarCreateRequestStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
                  <Input value={form.imageUrl} onChange={(e) => setTop("imageUrl", e.target.value)}
                    className="h-9 bg-muted/40 border-border/50" placeholder="https://..." />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <input type="checkbox" id="inResearch" checked={form.inResearch}
                    onChange={(e) => setTop("inResearch", e.target.checked)}
                    className="h-4 w-4 accent-primary" />
                  <Label htmlFor="inResearch" className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground cursor-pointer">
                    In Research
                  </Label>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="font-quicksand text-xs uppercase tracking-widest text-muted-foreground mb-3">Configuration</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["engineName", "engineType", "transmissionType", "suspensionType", "brakeType"] as const).map((k) => (
                    <div key={k} className="grid gap-1.5">
                      <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                        {k.replace(/([A-Z])/g, " $1")}
                      </Label>
                      <Input value={form.configuration[k]} onChange={(e) => setCfg(k, e.target.value)}
                        className="h-9 bg-muted/40 border-border/50" required />
                    </div>
                  ))}
                  {(["enginePower", "maxSpeed", "weight", "length"] as const).map((k) => (
                    <div key={k} className="grid gap-1.5">
                      <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                        {k.replace(/([A-Z])/g, " $1")}
                      </Label>
                      <Input type="number" value={form.configuration[k]} onChange={(e) => setCfg(k, e.target.value)}
                        className="h-9 bg-muted/40 border-border/50 font-mono" required />
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Car
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError("") }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading cars...
        </div>
      ) : cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Car className="h-10 w-10 opacity-30" />
          <p className="font-quicksand text-sm">No cars registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((c) => (
            <Card key={c.id} className="border-border/60 hover:border-border transition-colors overflow-hidden">
              {c.imageUrl && (
                <div className="h-32 w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">#{c.carNumber}</Badge>
                    <span className="font-heading font-semibold text-sm">{c.name}</span>
                  </div>
                  <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0 ${STATUS_COLORS[c.status ?? ""] ?? ""}`}>
                    {c.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{c.configuration?.enginePower} HP</span>
                  <span>{c.configuration?.maxSpeed} km/h max</span>
                  <span>{c.location}</span>
                  {c.inResearch && <span className="text-yellow-500">In Research</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
