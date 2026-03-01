import { Metadata } from "next"
import { RegistroForm } from "@/components/auth/registro-form"

export const metadata: Metadata = {
  title: "Criar Conta - Complexo Wellness",
  description: "Crie sua conta Complexo Wellness e comece sua transformação",
}

export default function RegistroPage() {
  return <RegistroForm />
}
