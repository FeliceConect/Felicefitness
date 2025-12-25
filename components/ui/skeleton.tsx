import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'shimmer' | 'none'
}

function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
    none: '',
  }

  return (
    <div
      className={cn(
        "bg-muted",
        variants[variant],
        animations[animation],
        className
      )}
      {...props}
    />
  )
}

// Skeleton presets for common components
function SkeletonCard() {
  return (
    <div className="bg-background-card rounded-xl p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="h-16 w-16 rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonWorkoutCard() {
  return (
    <div className="bg-background-card rounded-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>

      {/* Score */}
      <div className="flex justify-center py-8">
        <Skeleton variant="circular" className="w-[120px] h-[120px]" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* List */}
      <Skeleton className="h-5 w-24 mt-4" />
      <SkeletonList count={3} />
    </div>
  )
}

function SkeletonMealCard() {
  return (
    <div className="bg-background-card rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonWorkoutCard,
  SkeletonDashboard,
  SkeletonMealCard
}
