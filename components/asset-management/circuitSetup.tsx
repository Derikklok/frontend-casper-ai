"use client"

import { useState } from "react"
import { useGetCircuits, useCreateCircuit } from "@/api/endpoints/asset-controller/asset-controller"
import type { CircuitCreateRequest } from "@/api/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Map, Timer, CornerDownRight } from "lucide-react"

const EMPTY_FORM: CircuitCreateRequest = {
  name: "", country: "", city: "", length: 0, layoutUrl: "",
  lapRecord: "", imageUrl: "", firstParticipationYear: 2000,
  numberOfCorners: 0, description: "",
}

export default function CircuitSetup() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CircuitCreateRequest>(EMPTY_FORM)
  const [error, setError] = useState("")

  const { data, isLoading, refetch } = useGetCircuits()
  const createMutation = useCreateCircuit()

  const circuits = data?.result ?? []

  const set = (k: keyof CircuitCreateRequest, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    createMutation.mutate(
      {
        data: {
          ...form,
          length: Number(form.length),
          firstParticipationYear: Number(form.firstParticipationYear),
          numberOfCorners: Number(form.numberOfCorners),
        },
      },
      {
        onSuccess: () => { setForm(EMPTY_FORM); setShowForm(false); refetch() },
        onError: () => setError("Failed to create circuit. Check all fields."),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide">Circuits</h2>
          <p className="font-google-flex text-sm text-muted-foreground mt-0.5">{circuits.length} registered</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Circuit
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base uppercase tracking-wide">New Circuit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {(["name", "country", "city", "lapRecord"] as const).map((k) => (
                <div key={k} className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="h-9 bg-muted/40 border-border/50"
                    placeholder={k === "lapRecord" ? "1:23.456" : undefined} required />
                </div>
              ))}
              {(["length", "firstParticipationYear", "numberOfCorners"] as const).map((k) => (
                <div key={k} className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input type="number" value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="h-9 bg-muted/40 border-border/50 font-mono" required />
                </div>
              ))}
              {(["imageUrl", "layoutUrl"] as const).map((k) => (
                <div key={k} className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="h-9 bg-muted/40 border-border/50" placeholder="https://..." />
                </div>
              ))}
              <div className="col-span-2 grid gap-1.5">
                <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                <Input value={form.description} onChange={(e) => set("description", e.target.value)}
                  className="h-9 bg-muted/40 border-border/50" />
              </div>
              {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
              <div className="col-span-2 flex gap-3 pt-1">
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Circuit
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
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading circuits...
        </div>
      ) : circuits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Map className="h-10 w-10 opacity-30" />
          <p className="font-quicksand text-sm">No circuits registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circuits.map((c) => (
            <Card key={c.id} className="border-border/60 hover:border-border transition-colors overflow-hidden">
              {c.imageUrl && (
                <div className="h-32 w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading font-semibold text-sm">{c.name}</p>
                    <p className="font-google-flex text-xs text-muted-foreground">{c.city}, {c.country}</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 shrink-0">
                    {c.firstParticipationYear}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Map className="h-3 w-3" />{c.length} km</span>
                  <span className="flex items-center gap-1"><CornerDownRight className="h-3 w-3" />{c.numberOfCorners} corners</span>
                  <span className="flex items-center gap-1 col-span-2"><Timer className="h-3 w-3" />Lap record: {c.lapRecord}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
