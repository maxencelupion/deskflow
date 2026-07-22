import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MonthlyQuota() {
  const { profile } = useAuth()
  const [usedHours, setUsedHours] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      return
    }

    async function fetchUsedHours() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

      // Fetch bookings for the current month
      const { data, error } = await supabase
        .from('bookings')
        .select('hours_charged')
        .eq('user_id', profile.id)
        .eq('status', 'confirmed')
        .gte('start_at', startOfMonth)
        .lt('start_at', startOfNextMonth)

      if (error) {
        console.error('Error loading bookings:', error)
      } else {
        setUsedHours(data.reduce((sum, booking) => sum + booking.hours_charged, 0))
      }

      setLoading(false)
    }

    fetchUsedHours()
  }, [profile])

  const quota = profile?.monthly_quota_hours ?? 0
  const percentUsed = usedHours !== null && quota > 0
    ? Math.min((usedHours / quota) * 100, 100)
    : 0

  const severity = usedHours === null || usedHours < quota * 0.8
    ? "normal"
    : usedHours >= quota
      ? "danger"
      : "warning"

  const fillClass = {
    normal: "bg-primary",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-destructive",
  }[severity]

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Monthly quota</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="font-semibold">{usedHours} hour{usedHours > 0 ? 's' : ''}</span>
              <span className="text-muted-foreground"> used of {quota} hour{quota > 0 ? 's' : ''}</span>
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", fillClass)}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.max(quota - usedHours, 0)} hour{Math.max(quota - usedHours, 0) > 0 ? 's' : ''} remaining
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
