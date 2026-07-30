import { isLateCancellation } from '@/lib/bookings'
import { formatTimeRange } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

export function UpcomingBookings({ bookings, loading, cancellingId, onCancel, page, totalPages, onPageChange }) {
  return (
    <div>
      <h2 className="mb-3.5 text-base font-semibold">Upcoming bookings</h2>
      {loading ? (
        <p className="text-sm text-home-muted">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">
          No upcoming bookings - use "New booking" to reserve a room.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {bookings.map((booking) => {
            const late = isLateCancellation(booking.start_at)
            const start = new Date(booking.start_at)

            return (
              <div
                key={booking.id}
                className="flex items-center gap-4 rounded-2xl border border-home-border bg-home-card px-5 py-4"
              >
                <div className="w-13 shrink-0 text-center">
                  <div className="text-[11px] text-home-muted-2 uppercase">{monthFormatter.format(start)}</div>
                  <div className="font-heading text-xl font-semibold">
                    {String(start.getDate()).padStart(2, '0')}
                  </div>
                </div>
                <div className="h-9 w-px bg-home-border" />
                <div className="flex-1">
                  <div className="text-[15px] font-semibold">
                    {booking.resources?.name} : Seat {booking.seat_number}
                  </div>
                  <div className="text-sm text-home-muted">
                    {formatTimeRange(booking.start_at, booking.end_at)} - {booking.resources?.sites?.name} -{' '}
                    {booking.hours_charged}h
                  </div>
                  {late && (
                    <div className="mt-0.5 text-xs text-home-muted-3">
                      Cancelling now won't refund these hours (inside the 24h window).
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={cancellingId === booking.id}
                  onClick={() => onCancel(booking)}
                  className="rounded-full border border-home-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-home-border disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )
          })}

          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
