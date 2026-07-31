import { useState } from 'react'
import { Spinner } from '@/components/Spinner'
import { isLateCancellation } from '@/lib/bookings'
import { groupConsecutiveBy } from '@/lib/utils'
import { formatGreetingDate, formatTimeRange, toDateInputValue } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'
import { ViewToggle } from '@/components/ViewToggle'
import { BookingsMonthCalendar } from '@/components/BookingsMonthCalendar'

export function UpcomingBookings({
  bookings,
  monthBookings,
  loading,
  cancellingId,
  onCancel,
  page,
  totalPages,
  onPageChange,
}) {
  const [view, setView] = useState('calendar')

  function renderCard(booking) {
    const late = isLateCancellation(booking.start_at)

    return (
      <div key={booking.id} className="home-booking-card">
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
          className="home-pill-outline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Upcoming bookings</h2>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'calendar' ? (
        <BookingsMonthCalendar
          bookings={monthBookings}
          renderBooking={renderCard}
          emptyMessage="No upcoming bookings on this day."
        />
      ) : loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">
          No upcoming bookings - use "New booking" to reserve a room.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupConsecutiveBy(bookings, (b) => toDateInputValue(new Date(b.start_at))).map((group) => (
            <div key={group.key}>
              <div className="home-group-label mb-2.5">
                {formatGreetingDate(new Date(group.items[0].start_at))}
              </div>
              <div className="flex flex-col gap-2.5">
                {group.items.map(renderCard)}
              </div>
            </div>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
