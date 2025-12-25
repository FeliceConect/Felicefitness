'use client'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:bg-primary focus:text-primary-foreground
        focus:px-4 focus:py-2 focus:rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        focus:ring-offset-background
      "
    >
      Pular para o conteúdo principal
    </a>
  )
}
