import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - Complexo Wellness",
  description: "Faça login na sua conta Complexo Wellness",
}

export default function LoginPage() {
  return <LoginForm />
}
