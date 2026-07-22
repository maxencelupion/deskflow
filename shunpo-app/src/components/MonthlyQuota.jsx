import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { fetchMonthlyUsedHours } from '@/lib/bookings'
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

    fetchMonthlyUsedHours(profile.id)
      .then(setUsedHours)
      .catch((error) => console.error('Error loading bookings:', error))
      .finally(() => setLoading(false))
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

  const daysLeftUntilNextMonth = Math.ceil((new Date().setMonth(new Date().getMonth() + 1, 1) - new Date()) / (1000 * 3600 * 24));
  const resetText = daysLeftUntilNextMonth > 0 ? `in ${daysLeftUntilNextMonth} day${daysLeftUntilNextMonth > 1 ? 's' : ''}` : "today"

  return (
    <Card className="h-32 self-start">
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
