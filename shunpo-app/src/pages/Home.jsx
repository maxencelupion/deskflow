import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AuthForm } from '@/components/AuthForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useHomeStats } from '@/hooks/useHomeStats'
import { supabase } from '@/lib/supabase'

const DEMO_CREDENTIALS = {
  admin: { email: 'admina@test.com', password: 'password' },
  manager: { email: 'managera@test.com', password: 'password' },
  user: { email: 'membera@test.com', password: 'password' },
}

const FEATURES = [
  {
    image: '/home_availability.jpg',
    title: 'Real-time availability',
    description: 'See instantly which rooms are free, no back-and-forth over email.',
  },
  {
    image: '/home_sites.jpg',
    title: 'Filter by site and floor',
    description: 'Find a room near you in a few clicks, wherever you are.',
  },
  {
    image: '/home_oneplace.png',
    title: 'Bookings in one place',
    description: 'All your upcoming bookings gathered on a single screen.',
  },
]

const PILL_FILLED =
  'inline-flex items-center justify-center rounded-full bg-home-ink px-6 py-3.5 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80 disabled:opacity-50'

export default function Home() {
  const { sites, rooms, offices, loading: statsLoading } = useHomeStats()
  const [authOpen, setAuthOpen] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)

  async function handleDemoLogin(role) {
    setDemoLoading(role)
    await supabase.auth.signInWithPassword(DEMO_CREDENTIALS[role])
    setDemoLoading(null)
  }

  return (
    <div className="min-h-svh bg-home-bg text-home-ink">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <section className="relative mx-4 mt-14 flex h-105 items-end overflow-hidden rounded-3xl md:mx-6 md:h-160">
        <img
          src="/home_background.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative m-4 max-w-155 rounded-2xl bg-home-bg/80 p-4 backdrop-blur-sm md:m-8 md:p-6">
          <h1 className="font-heading text-3xl leading-[1.05] font-semibold tracking-tight md:text-5xl">
            Space, on your schedule.
          </h1>
          <p className="mt-3 max-w-120 text-base leading-relaxed text-home-ink-soft md:text-lg">
            Book a room or an office across any of your company's coworking sites in seconds.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={demoLoading !== null}
              className={PILL_FILLED}
            >
              {demoLoading === 'admin' ? '...' : 'Log in as admin'}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('manager')}
              disabled={demoLoading !== null}
              className={PILL_FILLED}
            >
              {demoLoading === 'manager' ? '...' : 'Log in as manager'}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('user')}
              disabled={demoLoading !== null}
              className={PILL_FILLED}
            >
              {demoLoading === 'user' ? '...' : 'Log in as user'}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-300 px-6 pt-16 md:px-14 md:pt-20">
        <div className="border-t border-home-border pt-8">
          <div className="grid grid-cols-3 gap-8 sm:max-w-2xl">
            <div className="text-left">
              <div className="font-heading text-4xl font-semibold">
                {statsLoading ? '—' : (sites ?? '—')}
              </div>
              <div className="text-sm text-home-muted">sites</div>
            </div>
            <div className="text-left">
              <div className="font-heading text-4xl font-semibold">
                {statsLoading ? '—' : (offices ?? '—')}
              </div>
              <div className="text-sm text-home-muted">offices available</div>
            </div>
            <div className="text-left">
              <div className="font-heading text-4xl font-semibold">
                {statsLoading ? '—' : (rooms ?? '—')}
              </div>
              <div className="text-sm text-home-muted">rooms available</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-300 px-6 py-16 md:px-14 md:py-24">
        <h2 className="mb-10 max-w-130 font-heading text-3xl font-semibold md:mb-12 md:text-[34px]">
          Built for teams on the move.
        </h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <div className="mb-5 aspect-4/3 w-full overflow-hidden rounded-2xl bg-home-placeholder">
                <img src={feature.image} alt="" className="h-full w-full object-cover" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-home-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-sm">
          <AuthForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
