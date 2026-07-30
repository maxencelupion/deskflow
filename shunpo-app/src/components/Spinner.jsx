import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("size-5 animate-spin rounded-full border-2 border-home-border border-t-home-ink", className)}
    />
  )
}
