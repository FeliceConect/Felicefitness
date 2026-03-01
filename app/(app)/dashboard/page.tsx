import { Metadata } from "next"
import { DashboardContent } from "./dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard - Complexo Wellness",
  description: "Seu painel de controle Complexo Wellness",
}

export default function DashboardPage() {
  return <DashboardContent />
}
