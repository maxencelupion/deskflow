import { formatTimeRange } from '@/lib/dates'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

export function NextBookingCard({ booking }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl bg-home-ink p-6 text-home-bg">
      <div className="mb-2 text-xs font-semibold tracking-wide text-home-bg/60 uppercase">Next up</div>
      {booking ? (
        <>
          <div className="font-heading text-xl font-semibold">
            {booking.resources?.name} : Seat {booking.seat_number}
          </div>
          <div className="text-sm text-home-bg/70">
            {String(new Date(booking.start_at).getDate()).padStart(2, '0')}{' '}
            {monthFormatter.format(new Date(booking.start_at))},{' '}
            {formatTimeRange(booking.start_at, booking.end_at)}
          </div>
        </>
      ) : (
        <div className="text-sm text-home-bg/70">No upcoming bookings yet.</div>
      )}
    </div>
  )
}
