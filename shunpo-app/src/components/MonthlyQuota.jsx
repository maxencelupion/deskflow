const monthLabelFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' })

export function MonthlyQuota({ quotaUsed, quotaTotal, quotaRemaining, quotaPercent, resetText }) {
  return (
    <div className="rounded-2xl border border-home-border bg-home-card p-6">
      <div className="mb-3 text-xs font-semibold tracking-wide text-home-muted uppercase">
        Monthly hour quota - {monthLabelFormatter.format(new Date())}
      </div>
      <div className="mb-3.5 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold">{quotaUsed}h</span>
        <span className="text-[15px] text-home-muted-2">used of {quotaTotal}h</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-home-border">
        <div
          className="h-full rounded-full bg-home-ink transition-all"
          style={{ width: `${quotaPercent}%` }}
        />
      </div>
      <div className="mt-2.5 text-sm text-home-muted">
        {quotaRemaining} hour{quotaRemaining > 1 ? 's' : ''} remaining this month, resets {resetText}
      </div>
    </div>
  )
}
