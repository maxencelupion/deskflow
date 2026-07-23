import { AuthForm } from '../components/AuthForm'
import { Bubbles, Waves } from '@/components/BeachScene'

export default function Auth() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Bubbles />
        <Waves />

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <img src="/logo.svg" alt="" className="size-6" />
          DeskFlow
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex max-w-md flex-col gap-4 text-center">
            <p className="text-3xl leading-tight font-semibold text-balance">
              Book your workspace in seconds.
            </p>
          </div>
        </div>

        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} DeskFlow
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
