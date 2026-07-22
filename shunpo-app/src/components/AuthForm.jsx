import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { LoginForm } from "@/components/LoginForm"
import { SignupForm } from "@/components/SignupForm"

export function AuthForm({ className, ...props }) {
  const [mode, setMode] = useState("login") // 'login' | 'signup'
  const emailRef = useRef("")

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {mode === "login" ? (
        <LoginForm emailRef={emailRef} onSwitchToSignup={() => setMode("signup")} />
      ) : (
        <SignupForm emailRef={emailRef} onSwitchToLogin={() => setMode("login")} />
      )}
    </div>
  )
}
