"use client"

import Cookies from "js-cookie"
import {
  BrainCircuit,
  Flag,
  LayoutDashboard,
  LogOut,
  Package,
  RadioTower,
  Settings,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ElementType, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { name: string; icon: ElementType; href: string }[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Race Seq", icon: Flag, href: "/admin/dashboard/race-sequence" },
  { name: "Pit Wall", icon: RadioTower, href: "/admin/dashboard/pit-wall" },
  {
    name: "Strategy Matrix",
    icon: BrainCircuit,
    href: "/admin/dashboard/strategy-matrix",
  },
  { name: "Asset Management", icon: Package, href: "/admin/dashboard/assets" },
  { name: "Settings", icon: Settings, href: "/admin/dashboard/team" },
]

function getActivePath(pathname: string) {
  return pathname === "/admin/dashboard"
    ? pathname
    : NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href
}

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const activePath = getActivePath(pathname)

  const handleExit = () => {
    Cookies.remove("auth_token")
    Cookies.remove("user_details")
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-50 flex min-h-14 items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-6">
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="flex shrink-0 items-center gap-2 border-r border-border/50 pr-6 transition-opacity hover:opacity-80"
            aria-label="Go to dashboard"
          >
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bitcount text-lg font-bold tracking-[0.18em]">
              CASPER<span className="text-primary">.AI</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 font-quicksand text-xs font-semibold tracking-widest uppercase lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  activePath === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            SYS: ONLINE
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="gap-2 border-destructive/40 font-quicksand text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
