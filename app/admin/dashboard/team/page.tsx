"use client"

import { useRouter } from "next/navigation"

import TeamSetup from "@/components/team-management/teamSetup"

export default function TeamPage() {
  const router = useRouter()

  return <TeamSetup onBack={() => router.push("/admin/dashboard")} />
}
