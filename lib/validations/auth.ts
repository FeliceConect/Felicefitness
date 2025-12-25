import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Digite um email válido"),
  password: z
    .string()
    .min(1, "A senha é obrigatória")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "O nome é obrigatório")
      .min(2, "O nome deve ter no mínimo 2 caracteres"),
    email: z
      .string()
      .min(1, "O email é obrigatório")
      .email("Digite um email válido"),
    password: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "A senha deve ter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve ter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

// Função para calcular força da senha
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    return { score, label: "Fraca", color: "bg-error" }
  } else if (score <= 4) {
    return { score, label: "Média", color: "bg-warning" }
  } else {
    return { score, label: "Forte", color: "bg-success" }
  }
}
