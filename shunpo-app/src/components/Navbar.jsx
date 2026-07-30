import { Link, NavLink } from "react-router-dom"
import { LayoutDashboard, LogOut, Users as UsersIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useScrollDirection } from "@/hooks/useScrollDirection"

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
]

export function Navbar({ onLoginClick }) {
  const hidden = useScrollDirection()
  const { session, profile } = useAuth()
  const links = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(profile?.role))

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 border-b bg-home-bg/95 backdrop-blur transition-transform duration-300 supports-backdrop-filter:bg-home-bg/60",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center px-4 md:px-14">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <img src="/logo.svg" alt="" className="size-6" />
          <span className="hidden sm:inline">DeskFlow</span>
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
                    <span className="hidden sm:inline">{link.label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="col-start-3 flex justify-end">
          {session ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Log out"
              className="hover:text-red-600 dark:hover:text-red-500"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="size-4" />
            </Button>
          ) : onLoginClick ? (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full bg-home-ink px-4 py-2 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80"
            >
              Log in
            </button>
          ) : (
            <Link
              to="/"
              className="rounded-full bg-home-ink px-4 py-2 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
