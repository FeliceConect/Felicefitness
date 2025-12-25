import { Logo } from "@/components/shared/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 safe-top safe-bottom">
      {/* Background gradient sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Logo size="lg" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center text-sm text-foreground-muted">
        Transforme seu corpo e mente
      </p>
    </div>
  )
}
