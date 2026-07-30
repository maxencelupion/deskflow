import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '@/lib/enums'

const STYLES = {
  [BOOKING_STATUS.CONFIRMED]: 'bg-emerald-100 text-emerald-700',
  [BOOKING_STATUS.CANCELLED_NOT_CHARGED]: 'bg-slate-100 text-slate-600',
  [BOOKING_STATUS.CANCELLED_CHARGED]: 'bg-amber-100 text-amber-700',
}

export function BookingStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${STYLES[status] ?? 'bg-home-border text-home-ink'}`}
    >
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  )
}
