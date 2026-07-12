import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  BrainCircuit,
  Flag,
  Gauge,
  Network,
  RadioTower,
  Timer,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CasperLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold tracking-wider">
            CASPER<span className="text-primary">.AI</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#hitl" className="hover:text-primary transition-colors">HITL Protocol</Link>
          <Link href="#telemetry" className="hover:text-primary transition-colors">Telemetry</Link>
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
        <section className="relative overflow-hidden px-6 pt-16 md:pt-24 lg:pt-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            
            {/* Left: Text Content */}
            <div className="flex flex-1 flex-col items-start gap-6 lg:gap-8">
              <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-full">
                <RadioTower className="mr-2 h-3 w-3 inline-block" />
                Live Pit-Wall Integration
              </Badge>
              <h1 className="font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
                Race Strategy, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                   Mastered by AI.
                </span><br />
                Commanded by You.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                CASPER AI processes millions of live F1 telemetry data points in milliseconds. It predicts dynamic race scenarios, optimizes pit windows, and suggests strategy—but the final call is always yours.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
                  <Activity className="mr-2 h-5 w-5" /> Initialize Dashboard
                </Button>
                <Button size="lg" variant="secondary" className="h-14 px-8 text-base">
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
                   <div className="bg-background/90 backdrop-blur rounded-lg px-3 py-1.5 border border-border shadow-sm flex items-center gap-2 text-xs font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      API Connected
                   </div>
                   <div className="bg-background/90 backdrop-blur rounded-lg px-3 py-1.5 border border-border shadow-sm flex items-center gap-2 text-xs font-semibold">
                      <Timer className="h-3 w-3 text-primary" />
                      Latency: 12ms
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Features Section */}
        <section id="features" className="relative mt-24 border-t border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Unprecedented Race Intelligence
              </h2>
              <p className="mt-4 text-muted-foreground mx-auto max-w-150 text-lg">
                CASPER brings elite computation to the pit wall. React to Safety Cars, weather changes, and tire degradation before your rivals do.
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
          <div className="mx-auto max-w-7xl flex flex-col gap-16 lg:flex-row items-center">
             
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
                  <div className="absolute bottom-6 left-1/2 w-[90%] -translate-x-1/2 bg-background/95 backdrop-blur-md rounded-xl p-4 border border-primary/30 shadow-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-2 flex items-center justify-between">
                       Action Required <Badge variant="destructive" className="h-4 text-[10px]">Critical</Badge>
                    </p>
                    <p className="text-sm font-medium mb-3">Box for Inters? Track surface saturation reaching 65% in Turn 4.</p>
                    <div className="flex gap-2 w-full">
                       <Button className="w-1/2 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">Confirm Box</Button>
                       <Button variant="outline" className="w-1/2 h-8 text-xs">Hold Position</Button>
                    </div>
                  </div>
                </div>
             </div>

             {/* HITL Text Content */}
             <div className="lg:w-1/2 flex flex-col items-start gap-6">
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary border border-primary/20">
                  <BrainCircuit className="h-5 w-5" />
                  Human-In-The-Loop Architecture
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
                  AI proposes.<br/> 
                  <span className="text-primary">You</span> pull the trigger.
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                  <p>
                    In the adrenaline-fueled environment of F1, full automation is a liability. CASPER operates on a rigorous <strong>Human-in-the-Loop (HITL)</strong> methodology. 
                  </p>
                  <p>
                    CASPER runs the millions of simulations, factors the math, and presents optimal strategy deviations. It empowers the Race Engineer to apply their human intuition, driver relationship knowledge, and tactical grit to approve or override the system dynamically.
                  </p>
                </div>

                <ul className="grid gap-3 mt-4 text-sm font-medium w-full">
                   <li className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border">
                      <div className="h-2 w-2 rounded-full bg-primary" /> System flags critical variables (Rain, VSC)
                   </li>
                   <li className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border">
                      <div className="h-2 w-2 rounded-full bg-primary" /> Calculates fastest route to the checkered flag
                   </li>
                   <li className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-primary/40 shadow-sm text-foreground">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Engineer verifies context & approves via headset/dashboard
                   </li>
                </ul>
             </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
         <div className="flex justify-center items-center gap-2 mb-4">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold text-foreground">CASPER<span className="text-primary">.AI</span></span>
         </div>
         <p>© {new Date().getFullYear()} CASPER Strategy Systems. Designed for the Pit Wall.</p>
         <div className="mt-2 font-mono text-xs">
          (Press <kbd className="px-1 py-0.5 border border-border rounded bg-secondary">d</kbd> to toggle dark mode)
        </div>
      </footer>
    </div>
  );
}

// Simple Helper Component for Feature Cards
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border/60 bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardHeader>
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}