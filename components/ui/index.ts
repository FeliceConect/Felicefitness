/**
 * FeliceFit UI Components
 * Exporta todos os componentes de UI do design system
 */

// Base components (shadcn/ui)
export { Button, buttonVariants } from './button'
export { Input } from './input'
export { Label } from './label'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export { Avatar, AvatarFallback, AvatarImage } from './avatar'
export { Badge, badgeVariants } from './badge'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
export { Switch } from './switch'
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
export { Textarea } from './textarea'
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
export { ScrollArea, ScrollBar } from './scroll-area'
export { Slider } from './slider'
export { Skeleton } from './skeleton'
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast'
export { Toaster } from './toaster'
export { useToast, toast } from './use-toast'

// Animations
export * from './animations'

// States (Loading, Empty, Error, Offline)
export { EmptyState, EMPTY_STATES } from './states/empty-state'
export { ErrorState, NetworkError, NotFoundError, PermissionError } from './states/error-state'
export { LoadingState } from './states/loading-state'
export { OfflineBanner, OfflineIndicator } from './states/offline-state'
export { ComingSoon } from './states/coming-soon'

// Accessibility
export * from './accessibility'

// Polish
export * from './polish'

// Feedback (Success, Error, Loading animations)
export { SuccessAnimation, SuccessCheckmark } from './feedback/success-animation'
export { ErrorAnimation, ErrorX } from './feedback/error-animation'
export { LoadingSpinner, LoadingDots, LoadingPulse } from './feedback/loading-spinner'

// Performance
export * from './performance'

// Extended components
export { HapticButton, FloatingActionButton, IncrementButton, ToggleButton } from './haptic-button'
export { ToastProvider as EnhancedToastProvider, useToastEnhanced, ToastNotification } from './toast-enhanced'

// Skeleton presets
export {
  StatCardSkeleton,
  WorkoutCardSkeleton,
  MealCardSkeleton,
  MealListSkeleton,
  WaterCardSkeleton,
  GamificationSkeleton,
  ProfileHeaderSkeleton,
  ChartSkeleton,
  ExerciseSkeleton,
  ExerciseListSkeleton,
  InsightSkeleton,
  DashboardSkeleton,
  AlimentacaoSkeleton,
  TreinoSkeleton,
} from './skeleton-presets'
