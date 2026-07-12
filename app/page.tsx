import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Activity,
  BrainCircuit,
  Flag,
  Gauge,
  Network,
  RadioTower,
  Timer,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CasperLandingPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(160,54,27,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(160,54,27,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(160,54,27,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(160,54,27,0.12),transparent_30%)]" />
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bitcount text-xl font-bold tracking-[0.18em] text-foreground">
            CASPER<span className="text-primary">.AI</span>
          </span>
        </div>
        <nav className="font-quicksand hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link
            href="#features"
            className="transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link href="#hitl" className="transition-colors hover:text-primary">
            HITL Protocol
          </Link>
          <Link
            href="#telemetry"
            className="transition-colors hover:text-primary"
          >
            Telemetry
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:inline-flex">
            Login
          </Button>
          <Button>Start Session</Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-16 md:pt-24 lg:pt-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            {/* Left: Text Content */}
            <div className="flex flex-1 flex-col items-start gap-6 lg:gap-8">
              <Badge
                variant="outline"
                className="font-quicksand rounded-full border-primary/50 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-[0.28em] text-primary uppercase"
              >
                <RadioTower className="mr-2 inline-block h-3 w-3" />
                Live Pit-Wall Integration
              </Badge>
              <h1 className="font-heading text-5xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Race Strategy, <br />
                <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Mastered by AI.
                </span>
                <br />
                Commanded by You.
              </h1>
              <p className="font-google-flex max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                CASPER AI processes millions of live F1 telemetry data points in
                milliseconds. It predicts dynamic race scenarios, optimizes pit
                windows, and suggests strategy—but the final call is always
                yours.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base shadow-lg shadow-primary/20 transition-transform duration-300 hover:scale-105"
                >
                  <Activity className="mr-2 h-5 w-5" /> Initialize Dashboard
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 border border-border/70 bg-secondary/70 px-8 text-base"
                >
                  View Demo Telemetry
                </Button>
              </div>
            </div>

            {/* Right: Mascot Image 1 */}
            <div className="relative flex flex-1 items-center justify-center lg:justify-end">
              <div className="relative aspect-square w-full max-w-137.5 overflow-hidden rounded-3xl border border-primary/20 bg-card/50 shadow-2xl shadow-primary/10">
                <Image
                  src="/casper-in-pit.png"
                  alt="CASPER AI Mascot analyzing live race telemetry"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Floating Tech Badges for effect */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    API Connected
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
                    <Timer className="h-3 w-3 text-primary" />
                    Latency: 12ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Features Section */}
        <section
          id="features"
          className="relative mt-24 border-t border-border bg-muted/30 px-6 py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Unprecedented Race Intelligence
              </h2>
              <p className="font-google-flex mx-auto mt-4 max-w-150 text-lg text-muted-foreground">
                CASPER brings elite computation to the pit wall. React to Safety
                Cars, weather changes, and tire degradation before your rivals
                do.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Gauge className="h-8 w-8 text-primary" />}
                title="Live Tire Degradation"
                description="Aggregates cornering loads and stint histories to predict the exact lap the crossover occurs."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-primary" />}
                title="Dynamic Scenario Matrix"
                description="Instantly generates alternate strategies when unexpected Yellow or Red Flags are deployed."
              />
              <FeatureCard
                icon={<Network className="h-8 w-8 text-primary" />}
                title="Weather Micro-Forecasting"
                description="Integrates circuit-specific radar patterns to pinpoint track saturation levels minute-by-minute."
              />
              <FeatureCard
                icon={<Flag className="h-8 w-8 text-primary" />}
                title="Undercut Vulnerability"
                description="Monitors sector times of trailing cars to alert you exactly when an undercut window opens."
              />
            </div>
          </div>
        </section>

        {/* Human In The Loop (HITL) Section */}
        <section id="hitl" className="px-6 py-24 lg:py-32">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row">
            {/* Image 2 */}
            <div className="relative w-full max-w-md lg:w-1/2">
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl border-2 border-primary/20 shadow-[0_0_40px_-10px_rgba(var(--color-primary-rgb),0.3)]">
                <Image
                  src="/casper-working.png"
                  alt="CASPER giving a thumbs up after strategy approval"
                  fill
                  className="object-cover object-center"
                />
                {/* HITL Overlay UI Mockup */}
                <div className="absolute bottom-6 left-1/2 w-[90%] -translate-x-1/2 rounded-xl border border-primary/30 bg-background/95 p-4 shadow-lg backdrop-blur-md">
                  <p className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                    Action Required{" "}
                    <Badge variant="destructive" className="h-4 text-[10px]">
                      Critical
                    </Badge>
                  </p>
                  <p className="mb-3 text-sm font-medium">
                    Box for Inters? Track surface saturation reaching 65% in
                    Turn 4.
                  </p>
                  <div className="flex w-full gap-2">
                    <Button className="h-8 w-1/2 bg-primary text-xs text-primary-foreground hover:bg-primary/90">
                      Confirm Box
                    </Button>
                    <Button variant="outline" className="h-8 w-1/2 text-xs">
                      Hold Position
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* HITL Text Content */}
            <div className="flex flex-col items-start gap-6 lg:w-1/2">
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                <BrainCircuit className="h-5 w-5" />
                Human-In-The-Loop Architecture
              </div>
              <h2 className="font-heading text-4xl leading-tight font-bold md:text-5xl">
                AI proposes.
                <br />
                <span className="text-primary">You</span> pull the trigger.
              </h2>
              <div className="font-google-flex space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  In the adrenaline-fueled environment of F1, full automation is
                  a liability. CASPER operates on a rigorous{" "}
                  <strong>Human-in-the-Loop (HITL)</strong> methodology.
                </p>
                <p>
                  CASPER runs the millions of simulations, factors the math, and
                  presents optimal strategy deviations. It empowers the Race
                  Engineer to apply their human intuition, driver relationship
                  knowledge, and tactical grit to approve or override the system
                  dynamically.
                </p>
              </div>

              <ul className="font-quicksand mt-4 grid w-full gap-3 text-sm font-medium">
                <li className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3">
                  <div className="h-2 w-2 rounded-full bg-primary" /> System
                  flags critical variables (Rain, VSC)
                </li>
                <li className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3">
                  <div className="h-2 w-2 rounded-full bg-primary" /> Calculates
                  fastest route to the checkered flag
                </li>
                <li className="flex items-center gap-3 rounded-md border border-primary/40 bg-secondary/50 p-3 text-foreground shadow-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />{" "}
                  Engineer verifies context & approves via headset/dashboard
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-muted/20 px-6 py-12 text-sm text-muted-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
                CASPER<span className="text-primary">.AI</span>
              </span>
            </div>
            <p className="font-google-flex max-w-xl text-base leading-relaxed text-muted-foreground">
              Live strategy intelligence for the pit wall, designed to surface
              the right decision at the right time without overwhelming the
              engineer.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="font-quicksand rounded-full border border-border bg-background/60 px-3 py-1 text-xs tracking-[0.22em] text-foreground uppercase">
                System Ready
              </span>
              <span className="font-quicksand rounded-full border border-border bg-background/60 px-3 py-1 text-xs tracking-[0.22em] text-foreground uppercase">
                Engineer-in-Loop
              </span>
              <span className="font-quicksand rounded-full border border-border bg-background/60 px-3 py-1 text-xs tracking-[0.22em] text-foreground uppercase">
                Telemetry Online
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <p className="font-quicksand text-xs tracking-[0.22em] text-muted-foreground uppercase">
                Current Mode
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                Human-in-the-loop
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <p className="font-quicksand text-xs tracking-[0.22em] text-muted-foreground uppercase">
                Latency
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                12ms average
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <p className="font-quicksand text-xs tracking-[0.22em] text-muted-foreground uppercase">
                Availability
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                99.98% uptime
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <p className="font-quicksand text-xs tracking-[0.22em] text-muted-foreground uppercase">
                Decision Rule
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                Engineer approves
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} CASPER Strategy Systems. Designed for
            the Pit Wall.
          </p>
          <div className="font-mono">
            Press{" "}
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5">
              d
            </kbd>{" "}
            to toggle dark mode
          </div>
        </div>
      </footer>
    </div>
  )
}

// Simple Helper Component for Feature Cards
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <CardHeader>
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
