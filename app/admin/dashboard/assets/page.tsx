"use client"

import { useState } from "react"
import { Car, Map, User } from "lucide-react"
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

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
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

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === "drivers" && <DriverSetup />}
          {activeTab === "cars" && <CarSetup />}
          {activeTab === "circuits" && <CircuitSetup />}
        </div>
      </main>
    </div>
  )
}
