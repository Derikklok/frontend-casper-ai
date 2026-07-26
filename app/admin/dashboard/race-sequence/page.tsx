"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { BrainCircuit, Car, Flag, LayoutDashboard, LogOut, Map, Package, Settings } from "lucide-react"

import TeamSetup from "@/components/team-management/teamSetup"
import RaceSequenceSetup from "@/components/race-sequence-management/raceSequenceSetup"
import { Button } from "@/components/ui/button"

type NavItem =
  | { name: "Dashboard"; icon: typeof LayoutDashboard; href: string }
  | { name: "Race Seq"; icon: typeof Flag }
  | { name: "Strategy Matrix"; icon: typeof BrainCircuit }
  | { name: "Weather Radar"; icon: typeof Map }
  | { name: "Car Vitals"; icon: typeof Car }
  | { name: "Asset Management"; icon: typeof Package; href: string }
  | { name: "Settings"; icon: typeof Settings }

export default function RaceSequencePage() {
  const [navActive, setNavActive] = useState<NavItem["name"]>("Race Seq")
  const router = useRouter()

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Race Seq", icon: Flag },
    { name: "Strategy Matrix", icon: BrainCircuit },
    { name: "Weather Radar", icon: Map },
    { name: "Car Vitals", icon: Car },
    { name: "Asset Management", icon: Package, href: "/admin/dashboard/assets" },
    { name: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 pr-6 border-r border-border/50"
          >
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 font-quicksand text-xs font-semibold uppercase tracking-widest">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => ("href" in item && item.href ? router.push(item.href) : setNavActive(item.name))}
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
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

      {navActive === "Settings" ? <TeamSetup onBack={() => setNavActive("Race Seq")} /> : <RaceSequenceSetup />}
    </div>
  )
}