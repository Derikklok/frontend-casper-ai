"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { BrainCircuit, Car, Flag, LogOut, Map, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import DriverSetup from "@/components/asset-management/driverSetup"
import CarSetup from "@/components/asset-management/carSetup"
import CircuitSetup from "@/components/asset-management/circuitSetup"

type Tab = "drivers" | "cars" | "circuits"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "drivers", label: "Drivers", icon: User },
  { id: "cars", label: "Cars", icon: Car },
  { id: "circuits", label: "Circuits", icon: Map },
]

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("drivers")
  const router = useRouter()

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 pr-4 border-r border-border/50 hover:opacity-80 transition-opacity">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em] text-foreground">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </button>
          <span className="font-quicksand text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Asset Management
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 border border-border text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            SYS: ONLINE
          </div>
          <Button variant="outline" size="sm" onClick={handleExit}
            className="font-quicksand gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-border/60 bg-muted/20 px-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-quicksand text-xs font-semibold uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "drivers" && <DriverSetup />}
          {activeTab === "cars" && <CarSetup />}
          {activeTab === "circuits" && <CircuitSetup />}
        </div>
      </main>
    </div>
  )
}
