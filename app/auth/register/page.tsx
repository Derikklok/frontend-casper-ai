"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  BrainCircuit,
  ChevronLeft,
  Cpu,
  KeyRound,
  ScanFace,
  ShieldAlert,
  UserCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRegister } from "@/api/endpoints/auth-controller/auth-controller"
import type { ApiResponseAuthResponse, AuthResponse } from "@/api/models"

export default function RegisterPage() {
  const router = useRouter()
  const registerMutation = useRegister()
  const [operatorName, setOperatorName] = useState("")
  const [callSign, setCallSign] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [registrationError, setRegistrationError] = useState("")

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegistrationError("")
    if (!acceptedTerms) {
      setRegistrationError("Acknowledge the confidentiality protocol before provisioning access.")
      return
    }

    registerMutation.mutate(
      { data: { operatorName, callSign, username, password } },
      {
        onSuccess: (response) => {
          // The generated register endpoint returns AuthResponse directly.
          const auth = response as AuthResponse
          if (!auth.token) {
            setRegistrationError("Registration succeeded, but no session token was returned. Please log in.")
            return
          }
          Cookies.remove("auth_token")
          Cookies.remove("user_details")
          Cookies.remove("auth_token", { path: "/" })
          Cookies.remove("user_details", { path: "/" })
          localStorage.removeItem("auth-token")
          Cookies.set("auth_token", auth.token, { path: "/" })
          localStorage.setItem("auth-token", auth.token)
          if (auth.user) Cookies.set("user_details", JSON.stringify(auth.user), { path: "/" })
          router.push("/admin/dashboard")
        },
        onError: (error: unknown) => {
          const apiError = error as { response?: { data?: ApiResponseAuthResponse } }
          setRegistrationError(apiError.response?.data?.message ?? "Registration failed. Please review the entered details.")
        },
      }
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col-reverse lg:grid lg:grid-cols-2 lg:flex-row">
      {/* Left Area - Registration Form */}
      <div className="relative z-10 flex flex-col justify-center bg-background px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="font-quicksand absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          ABORT PROTOCOL
        </Link>

        <div className="mx-auto mt-12 flex w-full max-w-112.5 flex-col justify-center space-y-8 lg:mt-0">
          {/* Header Branding */}
          <div className="flex flex-col space-y-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bitcount text-xl font-bold tracking-[0.18em] text-foreground">
                CASPER<span className="text-primary">.AI</span>
              </span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground uppercase">
              System Induction
            </h1>
            <p className="font-google-flex text-sm leading-relaxed text-muted-foreground">
              Provisioning a new terminal session. All entered data is encrypted
              via military-grade circuit tunneling.
            </p>
          </div>

          {/* Form */}
          <div className="grid gap-6">
            <form onSubmit={handleRegister}>
              <div className="grid gap-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Operative Name */}
                  <div className="grid gap-2">
                    <Label
                      htmlFor="name"
                      className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                    >
                      Operative Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={operatorName}
                        onChange={(event) => setOperatorName(event.target.value)}
                        placeholder="John Doe"
                        type="text"
                        required
                        className="h-11 border-border/50 bg-muted/40 pl-10 font-mono text-foreground"
                      />
                      <UserCircle className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    </div>
                  </div>

                  {/* Callsign */}
                  <div className="grid gap-2">
                    <Label
                      htmlFor="callsign"
                      className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                    >
                      Callsign
                    </Label>
                    <div className="relative">
                      <Input
                        id="callsign"
                        value={callSign}
                        onChange={(event) => setCallSign(event.target.value.toUpperCase())}
                        placeholder="GHOST-1"
                        type="text"
                        required
                        className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground uppercase"
                      />
                      <ScanFace className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>

                {/* ID Field */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="username"
                    className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                  >
                    Assigned Engineering ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="ENG-XXXX-XXXX"
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground uppercase"
                    />
                    <Cpu className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>

                {/* Access Code */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="password"
                    className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                  >
                    Define Access Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground"
                    />
                    <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>

                {/* Protocol Agreement Checkbox */}
                <div className="my-3 flex items-start space-x-3 rounded-lg border border-border/50 bg-secondary/30 p-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5 border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="terms"
                      className="font-google-flex text-xs leading-tight font-semibold text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Acknowledge Class-1 Confidentiality
                    </label>
                    <p className="font-google-flex text-[10px] leading-tight text-muted-foreground">
                      By proceeding, you agree to the FIA Data Handling
                      frameworks. Unauthorized distribution of CASPER telemetry
                      results in immediate session termination.
                    </p>
                  </div>
                </div>

                {registrationError && <p className="text-xs font-medium text-destructive">{registrationError}</p>}

                <Button type="submit" disabled={registerMutation.isPending} className="h-12 w-full font-heading text-base font-semibold tracking-wide shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                  {registerMutation.isPending ? "Provisioning Environment..." : "Provision Environment"}
                </Button>
              </div>
            </form>

            <div className="font-quicksand text-center text-xs tracking-wider text-muted-foreground">
              Already possess clearance?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-primary transition-colors hover:underline"
              >
                Initialize Login Handshake
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area - Dynamic Motion Image */}
      <div className="relative hidden min-h-100 w-full border-l border-border/30 bg-zinc-950 lg:block">
        <Image
          src="/max-1.jpg"
          alt="High-speed telemetry processing visualization"
          fill
          sizes="(max-width: 1024px) 0vw, 50vw"
          className="object-cover opacity-80"
          priority
        />
        {/* Dynamic Overlays to make the static image feel like a live dashboard */}
        <div className="absolute inset-0 bg-linear-to-l from-background/10 to-background dark:from-background/10 dark:to-background"></div>
        <div className="absolute inset-0 bg-primary/5 mix-blend-color-burn"></div>

        {/* Scanner line effect via CSS */}
        <div className="absolute top-0 left-0 h-0.5 w-full animate-in bg-primary/40 shadow-[0_0_15px_2px_rgba(var(--color-primary-rgb),0.8)] duration-1000 ease-linear repeat-infinite fade-in slide-in-from-top-full"></div>

        {/* Telemetry HUD Elements Over Image */}
        <div className="pointer-events-none absolute top-8 right-8 flex flex-col items-end gap-3">
          <Badge
            variant="outline"
            className="border-green-500/30 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-widest text-green-400 uppercase backdrop-blur-md"
          >
            <Activity className="mr-2 h-3 w-3 animate-pulse" /> Stream: Nominal
          </Badge>
          <Badge
            variant="outline"
            className="border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-widest text-white/70 uppercase backdrop-blur-md"
          >
            Bandwidth: 1.4 TB/s
          </Badge>
        </div>

        {/* Bottom Title Area */}
        <div className="absolute right-12 bottom-12 flex flex-col items-end text-right text-white">
          <ShieldAlert className="mb-3 h-8 w-8 text-primary opacity-80" />
          <h2 className="max-w-md font-heading text-3xl font-bold tracking-wide text-white uppercase shadow-black drop-shadow-xl">
            Data Streams Unlocked
          </h2>
          <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed tracking-wider text-white/50 uppercase">
            Awaiting new user token assignment to <br /> commence data synthesis
            protocol.
          </p>
        </div>
      </div>
    </div>
  )
}
