import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { fetchMonthlyUsedHours } from '@/lib/bookings'
import { getCurrentMonthRange } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MonthlyQuota({ refreshKey }) {
  const { profile } = useAuth()
  const [usedHours, setUsedHours] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      return
    }

    fetchMonthlyUsedHours(profile.id)
      .then(setUsedHours)
      .catch((error) => console.error('Error loading bookings:', error))
      .finally(() => setLoading(false))
  }, [profile, refreshKey])

  const quota = profile?.monthly_quota_hours ?? 0
  const percentUsed = usedHours !== null && quota > 0
    ? Math.min((usedHours / quota) * 100, 100)
    : 0

  function severityFor(used, quota) {
    if (used === null || used < quota * 0.8) {
      return "normal"
    }

    if (used >= quota) {
      return "danger"
    }

    return "warning"
  }

  const severity = severityFor(usedHours, quota)

  const fillClass = {
    normal: "bg-primary",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-destructive",
  }[severity]

  const { startOfNextMonth } = getCurrentMonthRange()
  const daysLeftUntilNextMonth = Math.ceil((startOfNextMonth - new Date()) / (1000 * 3600 * 24))
  const resetText = daysLeftUntilNextMonth > 0 ? `in ${daysLeftUntilNextMonth} day${daysLeftUntilNextMonth > 1 ? 's' : ''}` : "today"

  return (
    <Card className="h-32">
      <CardHeader>
        <CardTitle>Monthly quota</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="font-semibold">{usedHours} hour{usedHours > 1 ? 's' : ''}</span>
              <span className="text-muted-foreground"> used of {quota} hour{quota > 1 ? 's' : ''}</span>
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", fillClass)}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
                {Math.max(quota - usedHours, 0)} hour{Math.max(quota - usedHours, 0) > 1 ? 's' : ''} remaining, resetting {resetText}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
