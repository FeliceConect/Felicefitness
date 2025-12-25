import { Metadata } from "next"
import { DashboardContent } from "./dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard - FeliceFit",
  description: "Seu painel de controle FeliceFit",
}

export default function DashboardPage() {
  return <DashboardContent />
}
