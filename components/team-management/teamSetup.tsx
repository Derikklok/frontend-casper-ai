"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Building2, Copy, Loader2,
  MapPin, Plus, Radio, Users
} from "lucide-react"
import {
  useCreateTeam,
  useJoinTeam,
  useGetMyTeam,
} from "@/api/endpoints/team-controller/team-controller"
import type { ApiResponseTeamDto } from "@/api/models"

export default function TeamSetup({ onBack }: { onBack: () => void }) {
  // Create Team form state
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createHqLocation, setCreateHqLocation] = useState("")
  const [createLogoUrl, setCreateLogoUrl] = useState("")
  const [createError, setCreateError] = useState("")

  // Join Team form state
  const [inviteCode, setInviteCode] = useState("")
  const [joinError, setJoinError] = useState("")

  const [copied, setCopied] = useState(false)

  const createTeamMutation = useCreateTeam()
  const joinTeamMutation = useJoinTeam()
  const { data: myTeamResponse, isLoading: teamLoading, refetch } = useGetMyTeam()

  const myTeam = myTeamResponse?.result

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    createTeamMutation.mutate(
      { data: { name: createName, description: createDescription, hqLocation: createHqLocation, logoUrl: createLogoUrl || undefined } },
      {
        onSuccess: () => { refetch() },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: ApiResponseTeamDto } }
          setCreateError(err?.response?.data?.message || "Failed to create team.")
        },
      }
    )
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError("")
    joinTeamMutation.mutate(
      { data: { inviteCode } },
      {
        onSuccess: () => { refetch() },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: ApiResponseTeamDto } }
          setJoinError(err?.response?.data?.message || "Invalid invite code.")
        },
      }
    )
  }

  const handleCopyInvite = () => {
    if (myTeam?.inviteCode) {
      navigator.clipboard.writeText(myTeam.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-background text-foreground">

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Page Title */}
        <div className="mb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="font-quicksand mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground">
            Team Configuration
          </h1>
          <p className="font-google-flex mt-2 text-sm text-muted-foreground">
            Create a new race team or join an existing one using an invite code.
          </p>
        </div>

        {/* Loading state */}
        {teamLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Active Team Panel */}
        {!teamLoading && myTeam && (
          <Card className="mb-10 border-primary/40 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-heading text-sm uppercase tracking-widest font-bold">Active Team</span>
                </div>
                <Badge className="font-mono text-[10px] bg-green-500/10 text-green-500 border-green-500/30 border">
                  ENROLLED
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-2">{myTeam.name}</CardTitle>
              {myTeam.description && (
                <CardDescription className="font-google-flex">{myTeam.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 font-mono text-sm mt-2">
                {myTeam.hqLocation && (
                  <div className="flex items-center gap-3 py-2 border-b border-border/40">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">HQ Location</span>
                    <span className="ml-auto font-semibold">{myTeam.hqLocation}</span>
                  </div>
                )}
                {myTeam.id && (
                  <div className="flex items-center gap-3 py-2 border-b border-border/40">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Team ID</span>
                    <span className="ml-auto font-semibold text-xs text-muted-foreground">{myTeam.id}</span>
                  </div>
                )}
                {myTeam.inviteCode && (
                  <div className="flex items-center gap-3 py-2">
                    <Radio className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Invite Code</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="font-bold tracking-widest text-primary">{myTeam.inviteCode}</span>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={handleCopyInvite}
                        className="h-6 gap-1 border-border/50"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms — only show if no team yet */}
        {!teamLoading && !myTeam && (
          <div className="grid gap-8 md:grid-cols-2">

            {/* Create Team */}
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Plus className="h-4 w-4" />
                  <span className="font-heading text-xs uppercase tracking-widest font-bold">New Team</span>
                </div>
                <CardTitle>Create Team</CardTitle>
                <CardDescription className="font-google-flex">
                  Provision a new race team and become its lead engineer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase">
                      Team Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Scuderia Ghost"
                      required
                      minLength={2}
                      maxLength={50}
                      className="h-10 border-border/50 bg-muted/40 font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase">
                      HQ Location <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={createHqLocation}
                      onChange={(e) => setCreateHqLocation(e.target.value)}
                      placeholder="Maranello, Italy"
                      required
                      className="h-10 border-border/50 bg-muted/40 font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase">
                      Description
                    </Label>
                    <Input
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Optional team description"
                      className="h-10 border-border/50 bg-muted/40 font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase">
                      Logo URL
                    </Label>
                    <Input
                      value={createLogoUrl}
                      onChange={(e) => setCreateLogoUrl(e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className="h-10 border-border/50 bg-muted/40 font-mono"
                    />
                  </div>
                  {createError && (
                    <p className="text-xs font-medium text-destructive">{createError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending}
                    className="mt-2 h-11 w-full font-heading tracking-widest"
                  >
                    {createTeamMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" /> Provision Team</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Join Team */}
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Radio className="h-4 w-4" />
                  <span className="font-heading text-xs uppercase tracking-widest font-bold">Existing Team</span>
                </div>
                <CardTitle>Join Team</CardTitle>
                <CardDescription className="font-google-flex">
                  Enter an invite code to join an existing race team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase">
                      Invite Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="XXXX-XXXX"
                      required
                      className="h-10 border-border/50 bg-muted/40 font-mono tracking-widest uppercase"
                    />
                  </div>
                  {joinError && (
                    <p className="text-xs font-medium text-destructive">{joinError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={joinTeamMutation.isPending}
                    variant="outline"
                    className="mt-2 h-11 w-full font-heading tracking-widest border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {joinTeamMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
                    ) : (
                      <><Users className="mr-2 h-4 w-4" /> Join Team</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  )
}
