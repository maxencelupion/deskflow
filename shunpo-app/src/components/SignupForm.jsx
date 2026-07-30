import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { HOME_INPUT_CLASSNAME, isValidEmail } from "@/lib/utils"
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

export function SignupForm({ emailRef, onSwitchToLogin }) {
  const navigate = useNavigate()

  const [emailInvalid, setEmailInvalid] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 6
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password
  const signupInvalid = password.length < 6 || confirmPassword !== password

  useEffect(() => {
    const value = emailRef.current
    setEmailInvalid(value.length > 0 && !isValidEmail(value))
  }, [emailRef])

  function handleEmailChange(e) {
    const value = e.target.value
    emailRef.current = value
    setEmailInvalid(value.length > 0 && !isValidEmail(value))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email: emailRef.current, password })

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
        <CardTitle className="text-xl text-home-ink">Create an account</CardTitle>
        <CardDescription className="text-home-muted">Enter your email below to sign up</CardDescription>
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
                aria-invalid={emailInvalid}
                className={HOME_INPUT_CLASSNAME}
              />
              {emailInvalid && (
                <FieldDescription className="text-red-500">
                  Please enter a valid email address
                </FieldDescription>
              )}
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
                  aria-invalid={passwordTooShort}
                  className={`pr-8 ${HOME_INPUT_CLASSNAME}`}
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
              {passwordTooShort && (
                <FieldDescription className="text-red-500">
                  Password must be at least 6 characters
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword" className="text-home-ink">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-invalid={passwordMismatch}
                  className={`pr-8 ${HOME_INPUT_CLASSNAME}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center text-home-muted-2 hover:text-home-ink"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordMismatch && (
                <FieldDescription className="text-red-500">
                  Passwords do not match
                </FieldDescription>
              )}
            </Field>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Field>
              <Button
                type="submit"
                className="bg-home-ink text-base text-home-bg hover:bg-home-ink/85"
                disabled={loading || signupInvalid}
              >
                {loading ? "..." : "Sign up"}
              </Button>
              <FieldDescription className="text-center text-home-muted">
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onSwitchToLogin() }}
                  className="text-home-ink! hover:text-home-muted!"
                >
                  Log in
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
