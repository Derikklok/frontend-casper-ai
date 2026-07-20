"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import TeamSetup from "@/components/team-management/teamSetup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  AlertTriangle, BrainCircuit, Car, 
  Flag, Gauge, LayoutDashboard, LogOut, Map, Package, Settings, 
  ThermometerSun, Timer, Zap, Check, X
} from "lucide-react"
import { 
  ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Area, AreaChart 
} from "recharts"

// Mock Data for Telemetry Chart
const telemetryData = Array.from({ length: 40 }).map((_, i) => ({
  distance: i * 50,
  speed: 100 + Math.random() * 150 + (i > 10 && i < 20 ? 80 : 0) - (i > 30 ? 120 : 0),
  throttle: Math.random() > 0.5 ? 100 : Math.random() * 50,
}))

const timingData = [
  { p: 1, name: "VER", gap: "LEADER", tire: "M", laps: 12 },
  { p: 2, name: "NOR", gap: "+1.243", tire: "M", laps: 12 },
  { p: 3, name: "GHO (Us)", gap: "+3.104", tire: "S", laps: 18, highlight: true },
  { p: 4, name: "LEC", gap: "+4.882", tire: "H", laps: 4 },
  { p: 5, name: "PIA", gap: "+5.120", tire: "M", laps: 12 },
]

export default function EngineerDashboard() {
  const [navActive, setNavActive] = useState("Dashboard")
  const router = useRouter()

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Race Seq", icon: Flag, href: "/admin/dashboard/race-sequence" },
    { name: "Strategy Matrix", icon: BrainCircuit },
    { name: "Weather Radar", icon: Map },
    { name: "Car Vitals", icon: Car },
    { name: "Asset Management", icon: Package, href: "/admin/dashboard/assets" },
    { name: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 pr-6 border-r border-border/50">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </div>
          
          {/* Main Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 font-quicksand text-xs font-semibold uppercase tracking-widest">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => "href" in item && item.href ? router.push(item.href) : setNavActive(item.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  navActive === item.name 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Top Right User & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              SYS: ONLINE
            </div>
            <div className="px-3 py-1.5 rounded bg-muted/50 border border-border text-muted-foreground">
              ENG-77X | GHOST-1
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="font-quicksand gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </header>

      {/* Settings View */}
      {navActive === "Settings" && <TeamSetup onBack={() => setNavActive("Dashboard")} />}

      {/* 2. Top Race Context Bar */}
      {navActive !== "Settings" && (
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border border-b border-border bg-muted/20">
        <ContextStat icon={Flag} label="Race Status" value="GREEN FLAG" valueColor="text-green-500" />
        <ContextStat icon={Timer} label="Current Lap" value="Lap 42 / 72" />
        <ContextStat icon={Map} label="Track Sectors" value="S1: Clear | S2: Clear" />
        <ContextStat icon={ThermometerSun} label="Track Temp" value="34.2 °C" />
        <ContextStat icon={AlertTriangle} label="Rain Risk" value="12% (ETA 40m)" />
      </div>
      )}

      {/* Main Dashboard Grid */}
      {navActive !== "Settings" && (
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* LEFT COLUMN: CASPER AI Strategy Alert (Human in the loop core focus) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <Card className="border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--color-primary-rgb),0.2)] bg-linear-to-b from-primary/10 to-transparent relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse"></div>
               <CardHeader className="pb-2">
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2 text-primary font-bold">
                     <Zap className="h-5 w-5 fill-primary" /> 
                     <span className="font-heading uppercase tracking-widest text-lg">Hitl Intervention</span>
                   </div>
                   <Badge variant="destructive" className="animate-pulse font-mono rounded-sm">CRITICAL</Badge>
                 </div>
                 <CardTitle className="text-2xl font-bold mt-2">Undercut Window Open</CardTitle>
                 <CardDescription className="font-google-flex text-base">
                   Car 4 (LEC) tires dropping rapidly. Pitting now yields a 68% probability of track position overtake.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid gap-3 font-mono text-sm mb-6 mt-2">
                   <div className="flex justify-between py-2 border-b border-border/50">
                     <span className="text-muted-foreground">Calculated Pit Loss:</span>
                     <span className="text-foreground font-bold">21.4s</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-border/50">
                     <span className="text-muted-foreground">Estimated Gap at Exit:</span>
                     <span className="text-green-500 font-bold">+1.2s ahead of LEC</span>
                   </div>
                   <div className="flex justify-between py-2">
                     <span className="text-muted-foreground">Suggested Compound:</span>
                     <span className="text-white bg-zinc-700 px-2 rounded font-bold">HARD (C3)</span>
                   </div>
                 </div>
                 <div className="flex gap-3 w-full">
                    <Button className="w-2/3 h-12 bg-primary hover:bg-primary/80 font-heading tracking-widest uppercase">
                      <Check className="mr-2 h-4 w-4" /> Confirm Box
                    </Button>
                    <Button variant="outline" className="w-1/3 h-12 border-border/70 text-muted-foreground uppercase tracking-widest font-heading">
                      <X className="mr-2 h-4 w-4" /> Hold
                    </Button>
                 </div>
               </CardContent>
            </Card>

            {/* Tire Degradation Widget */}
            <Card className="border-border/60 flex-1">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-lg">Tire Telemetry</CardTitle>
                  <CardDescription>Soft Compound (18 Laps)</CardDescription>
                </div>
                <div className="h-8 w-8 rounded bg-red-500/20 flex items-center justify-center text-red-500 font-bold border border-red-500/50">
                   S
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 mt-2">
                 <TireStat label="Front Left" wear={82} temp="110°C" color="bg-yellow-500" />
                 <TireStat label="Front Right" wear={78} temp="108°C" color="bg-green-500" />
                 <TireStat label="Rear Left" wear={45} temp="124°C" color="bg-primary" />
                 <TireStat label="Rear Right" wear={42} temp="126°C" color="bg-primary" />
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE COLUMN: Live Telemetry Graph & Core Data */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <Card className="border-border/60 flex-1 flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle className="font-heading text-lg flex items-center justify-between">
                  <span>Speed Trace vs Track Distance</span>
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/50">LIVE <span className="w-2 h-2 rounded-full bg-primary animate-pulse ml-2"></span></Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={telemetryData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="distance" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace'}} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace'}} domain={[0, 350]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '8px' }}
                      itemStyle={{ fontFamily: 'monospace', color: 'white' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="speed" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Powertrain / ERS */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-border/60">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Gauge className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="font-quicksand text-xs uppercase tracking-widest text-muted-foreground mb-1">ERS Deployed</span>
                  <span className="font-heading text-3xl font-bold">42<span className="text-lg text-muted-foreground">%</span></span>
                  <div className="w-full bg-secondary h-2 mt-3 rounded-full overflow-hidden">
                    <div className="bg-yellow-400 h-full w-[42%]"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <BatteryIcon level={88} />
                  <span className="font-quicksand text-xs uppercase tracking-widest text-muted-foreground mb-1 mt-2">SoC (Charge)</span>
                  <span className="font-heading text-3xl font-bold">88<span className="text-lg text-muted-foreground">%</span></span>
                  <div className="w-full bg-secondary h-2 mt-3 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[88%]"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN: Timing Tower */}
          <div className="md:col-span-3">
             <Card className="border-border/60 h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="font-heading text-lg">Timing Tower</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                 <div className="grid grid-cols-[30px_1fr_60px_40px] text-xs font-quicksand uppercase tracking-wider text-muted-foreground p-3 border-b border-border/20">
                   <div>P</div>
                   <div>Driver</div>
                   <div className="text-right">Gap</div>
                   <div className="text-right">Tyre</div>
                 </div>
                 <div className="divide-y divide-border/20">
                   {timingData.map((driver) => (
                     <div 
                      key={driver.p} 
                      className={`grid grid-cols-[30px_1fr_60px_40px] items-center text-sm font-mono p-3 transition-colors hover:bg-muted/30 ${driver.highlight ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                     >
                       <div className={`${driver.highlight ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{driver.p}</div>
                       <div className="font-bold">{driver.name}</div>
                       <div className={`text-right ${driver.gap === 'LEADER' ? 'text-muted-foreground text-xs' : ''}`}>{driver.gap}</div>
                       <div className="text-right flex justify-end">
                         <span className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                           driver.tire === 'S' ? 'bg-red-500 text-white' : 
                           driver.tire === 'M' ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-black'
                         }`}>
                           {driver.tire}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Helper UI Components below to keep main file clean
// -------------------------------------------------------------

function ContextStat({ icon: Icon, label, value, valueColor = "text-foreground" }: { icon: React.ElementType, label: string, value: string, valueColor?: string }) {
  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <div className="bg-background border border-border p-2 rounded-md">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-quicksand text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`font-mono text-sm font-semibold mt-0.5 ${valueColor}`}>{value}</p>
      </div>
    </div>
  )
}

function TireStat({ label, wear, temp, color }: { label: string, wear: number, temp: string, color: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/30 border border-border/50">
      <span className="font-quicksand text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between font-mono mt-1">
        <span className="text-xl font-bold">{wear}%</span>
        <span className="text-xs text-muted-foreground mb-1">{temp}</span>
      </div>
      <div className="w-full bg-background border border-border/50 h-2 mt-1 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${wear}%` }}></div>
      </div>
    </div>
  )
}

function BatteryIcon({ level }: { level: number }) {
  return (
    <div className="relative w-8 h-4 border-2 border-muted-foreground rounded-sm p-px">
       <div className="h-full bg-foreground" style={{ width: `${level}%` }}></div>
       <div className="absolute -right-1 top-0.75 w-0.5 h-1.5 bg-muted-foreground rounded-r-sm"></div>
    </div>
  )
}