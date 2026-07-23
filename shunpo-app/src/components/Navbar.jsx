import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useScrollDirection } from "@/hooks/useScrollDirection"

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/users", label: "Users", roles: ["admin"] },
]

export function Navbar() {
  const hidden = useScrollDirection()
  const { session, profile } = useAuth()
  const links = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(profile?.role))

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/95 backdrop-blur transition-transform duration-300 supports-backdrop-filter:bg-background/60",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="mx-auto grid h-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <div />

        {session && (
          <nav className="flex items-center gap-4">
            {links.map((link, i) => (
              <div key={link.to} className="flex items-center gap-4">
                {i > 0 && <Separator orientation="vertical" className="h-4" />}
                <Link
                  to={link.to}
                  className="rounded-lg px-2.5 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>
        )}

        <div className="flex justify-end">
          {session && (
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-red-600 dark:hover:text-red-500"
              onClick={() => supabase.auth.signOut()}
            >
              Log out
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
