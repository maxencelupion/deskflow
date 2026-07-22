import { useAuth } from '@/context/useAuth'

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Connecté en tant que {profile?.role ?? '...'}
      </p>
    </div>
  )
}
