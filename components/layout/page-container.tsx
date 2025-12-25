import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        "min-h-screen pt-16 pb-20 px-4",
        className
      )}
    >
      {children}
    </main>
  )
}
