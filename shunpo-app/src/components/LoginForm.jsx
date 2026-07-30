import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({ emailRef, onSwitchToSignup }) {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleEmailChange(e) {
    const value = e.target.value
    emailRef.current = value
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailRef.current,
      password,
    })

    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate("/")
    }

    setLoading(false)
  }

  return (
    <Card className="bg-home-bg text-home-ink shadow-none ring-home-border">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-home-ink">Welcome back</CardTitle>
        <CardDescription className="text-home-muted">Enter your email below to log in</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email" className="text-home-ink">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                ref={(node) => { if (node) node.value = emailRef.current }}
                onChange={handleEmailChange}
                required
                className="border-home-border bg-white text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-home-ink">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border-home-border bg-white pr-8 text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center text-home-muted-2 hover:text-home-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Field>
              <Button
                type="submit"
                className="bg-home-ink text-base text-home-bg hover:bg-home-ink/85"
                disabled={loading || password.length === 0}
              >
                {loading ? "..." : "Log in"}
              </Button>
              <FieldDescription className="text-center text-home-muted">
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onSwitchToSignup() }}
                  className="text-home-ink! hover:text-home-muted!"
                >
                  Sign up
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
