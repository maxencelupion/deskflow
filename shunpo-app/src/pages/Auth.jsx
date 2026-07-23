import { AuthForm } from '../components/AuthForm'

const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round(((i * 37) % 100 + Math.random() * 6)),
  size: 6 + Math.round(Math.random() * 18),
  duration: 10 + Math.round(Math.random() * 10),
  delay: -(Math.random() * 20),
}))

function Bubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-primary-foreground/10 animate-rise"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Auth() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Bubbles />
        <svg
          className="absolute inset-x-0 bottom-0 h-2/3 w-full text-primary-foreground"
          viewBox="0 0 1440 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            opacity="0.08"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,256C1200,245,1320,203,1380,181.3L1440,160L1440,640L1380,640C1320,640,1200,640,1080,640C960,640,840,640,720,640C600,640,480,640,360,640C240,640,120,640,60,640L0,640Z"
          />
          <path
            fill="currentColor"
            opacity="0.12"
            d="M0,320L60,314.7C120,309,240,299,360,304C480,309,600,331,720,336C840,341,960,331,1080,314.7C1200,299,1320,277,1380,266.7L1440,256L1440,640L1380,640C1320,640,1200,640,1080,640C960,640,840,640,720,640C600,640,480,640,360,640C240,640,120,640,60,640L0,640Z"
          />
          <path
            fill="currentColor"
            opacity="0.18"
            d="M0,416L60,410.7C120,405,240,395,360,400C480,405,600,427,720,432C840,437,960,427,1080,410.7C1200,395,1320,373,1380,362.7L1440,352L1440,640L1380,640C1320,640,1200,640,1080,640C960,640,840,640,720,640C600,640,480,640,360,640C240,640,120,640,60,640L0,640Z"
          />
        </svg>

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
