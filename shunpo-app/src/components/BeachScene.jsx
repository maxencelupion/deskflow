import { cn } from '@/lib/utils'

const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round(((i * 37) % 100 + Math.random() * 6)),
  size: 6 + Math.round(Math.random() * 18),
  duration: 10 + Math.round(Math.random() * 10),
  delay: -(Math.random() * 20),
}))

export function Bubbles() {
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

export function Waves({ className }) {
  return (
    <svg
      className={cn("absolute inset-x-0 bottom-0 h-2/3 w-full text-primary-foreground", className)}
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
  )
}
