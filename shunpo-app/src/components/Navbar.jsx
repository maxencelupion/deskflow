import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useScrollDirection } from "@/hooks/useScrollDirection"

export function Navbar() {
  const hidden = useScrollDirection()
  const { session } = useAuth()

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/95 backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-background/60",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="font-heading text-sm font-semibold">
          Shunpo
        </Link>

        {session && (
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            Log out
          </Button>
        )}
      </div>
    </header>
  )
}
