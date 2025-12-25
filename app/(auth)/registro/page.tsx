import { Metadata } from "next"
import { RegistroForm } from "@/components/auth/registro-form"

export const metadata: Metadata = {
  title: "Criar Conta - FeliceFit",
  description: "Crie sua conta FeliceFit e comece sua transformação",
}

export default function RegistroPage() {
  return <RegistroForm />
}
