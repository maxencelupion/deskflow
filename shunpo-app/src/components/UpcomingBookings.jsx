import { Spinner } from '@/components/Spinner'
import { isLateCancellation } from '@/lib/bookings'
import { groupConsecutiveBy } from '@/lib/utils'
import { formatGreetingDate, formatTimeRange, toDateInputValue } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'

export function UpcomingBookings({ bookings, loading, cancellingId, onCancel, page, totalPages, onPageChange }) {
  return (
    <div>
      <h2 className="mb-3.5 text-base font-semibold">Upcoming bookings</h2>
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">
          No upcoming bookings - use "New booking" to reserve a room.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupConsecutiveBy(bookings, (b) => toDateInputValue(new Date(b.start_at))).map((group) => (
            <div key={group.key}>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-home-muted-2">
                {formatGreetingDate(new Date(group.items[0].start_at))}
              </div>
              <div className="flex flex-col gap-2.5">
                {group.items.map((booking) => {
                  const late = isLateCancellation(booking.start_at)

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 rounded-2xl border border-home-border bg-home-card px-5 py-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.12)] transition-shadow hover:shadow-[0_8px_20px_-8px_rgba(17,17,17,0.2)]"
                    >
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
                            Cancelling now won't refund these hours (starting time in less than 24 hours).
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
              </div>
            </div>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
