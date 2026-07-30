import { formatDateBlock, formatTimeRange } from '@/lib/dates'

export function NextBookingCard({ booking }) {
  const dateBlock = booking ? formatDateBlock(booking.start_at) : null

  return (
    <div className="flex flex-col justify-center rounded-2xl bg-home-ink p-6 text-home-bg">
      <div className="mb-2 text-xs font-semibold tracking-wide text-home-bg/60 uppercase">Next up</div>
      {booking ? (
        <>
          <div className="font-heading text-xl font-semibold">
            {booking.resources?.name} : Seat {booking.seat_number}
          </div>
          <div className="text-sm text-home-bg/70">
            {dateBlock.day} {dateBlock.month}, {formatTimeRange(booking.start_at, booking.end_at)}
          </div>
        </>
      ) : (
        <div className="text-sm text-home-bg/70">No upcoming bookings yet.</div>
      )}
    </div>
  )
}
