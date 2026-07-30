import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"

export function Footer() {
  const hidden = useScrollDirection()

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-40 border-t border-home-border bg-home-bg/95 backdrop-blur transition-transform duration-300 supports-backdrop-filter:bg-home-bg/60",
        hidden ? "translate-y-full" : "translate-y-0"
      )}
    >
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-center px-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} DeskFlow
      </div>
    </footer>
  )
}
