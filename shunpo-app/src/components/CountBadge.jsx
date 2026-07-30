export function CountBadge({ count }) {
  if (!count) {
    return <span className="text-sm text-home-muted-3">-</span>
  }

  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      {count}
    </span>
  )
}
