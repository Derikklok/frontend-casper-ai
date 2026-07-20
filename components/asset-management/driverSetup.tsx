"use client"

import { useState } from "react"
import { useGetDrivers, useCreateDriver } from "@/api/endpoints/asset-controller/asset-controller"
import type { DriverCreateRequest } from "@/api/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, User, Flag } from "lucide-react"

const EMPTY_FORM: DriverCreateRequest = {
  firstName: "", lastName: "", fullName: "", broadcastName: "",
  acronym: "", driverNumber: 1, imageUrl: "", countryCode: "",
}

export default function DriverSetup() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<DriverCreateRequest>(EMPTY_FORM)
  const [error, setError] = useState("")

  const { data, isLoading, refetch } = useGetDrivers()
  const createMutation = useCreateDriver()

  const drivers = data?.result ?? []

  const set = (k: keyof DriverCreateRequest, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    createMutation.mutate(
      { data: { ...form, driverNumber: Number(form.driverNumber) } },
      {
        onSuccess: () => { setForm(EMPTY_FORM); setShowForm(false); refetch() },
        onError: () => setError("Failed to create driver. Check all fields."),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide">Drivers</h2>
          <p className="font-google-flex text-sm text-muted-foreground mt-0.5">{drivers.length} registered</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Driver
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base uppercase tracking-wide">New Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {(["firstName", "lastName", "fullName", "broadcastName"] as const).map((k) => (
                <div key={k} className="grid gap-1.5">
                  <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="h-9 bg-muted/40 border-border/50" required />
                </div>
              ))}
              <div className="grid gap-1.5">
                <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Acronym (3)</Label>
                <Input value={form.acronym} onChange={(e) => set("acronym", e.target.value.toUpperCase())}
                  maxLength={3} className="h-9 bg-muted/40 border-border/50 font-mono uppercase" required />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Driver #</Label>
                <Input type="number" min={1} max={99} value={form.driverNumber}
                  onChange={(e) => set("driverNumber", e.target.value)}
                  className="h-9 bg-muted/40 border-border/50 font-mono" required />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Country Code (2)</Label>
                <Input value={form.countryCode} onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
                  maxLength={2} className="h-9 bg-muted/40 border-border/50 font-mono uppercase" required />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-quicksand text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
                <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
                  className="h-9 bg-muted/40 border-border/50" placeholder="https://..." />
              </div>
              {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
              <div className="col-span-2 flex gap-3 pt-1">
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Driver
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
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading drivers...
        </div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <User className="h-10 w-10 opacity-30" />
          <p className="font-quicksand text-sm">No drivers registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <Card key={d.id} className="border-border/60 hover:border-border transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
                  {d.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={d.imageUrl} alt={d.fullName} className="h-full w-full object-cover" />
                    : <User className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{d.acronym}</span>
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">#{d.driverNumber}</Badge>
                  </div>
                  <p className="font-heading font-semibold text-sm truncate">{d.fullName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flag className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{d.countryCode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
