import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - FeliceFit",
  description: "Faça login na sua conta FeliceFit",
}

export default function LoginPage() {
  return <LoginForm />
}
