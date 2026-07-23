import { Link, NavLink } from "react-router-dom"
import { LayoutDashboard, Users as UsersIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useScrollDirection } from "@/hooks/useScrollDirection"

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
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
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <img src="/logo.svg" alt="" className="size-6" />
          DeskFlow
        </Link>

        {session && (
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
                  )
                }
              >
                {({ isActive }) => (
                  <span
                    className={cn(
                      "flex items-center gap-1.5 border-b-2 pb-0.5",
                      isActive ? "border-primary" : "border-transparent"
                    )}
                  >
                    <link.icon className="size-4" />
                    {link.label}
                  </span>
                )}
              </NavLink>
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
