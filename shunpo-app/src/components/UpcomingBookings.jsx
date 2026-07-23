import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { BOOKING_STATUS } from '@/lib/bookings'
import { formatBookingRange } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewBookingDialog } from '@/components/NewBookingDialog'

// 24 hours in milliseconds
const LATE_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

function isLateCancellation(startAt) {
  // Everything is in milliseconds
  return new Date(startAt).getTime() - Date.now() < LATE_CANCELLATION_WINDOW_MS
}

async function fetchBookings(userId, page, pageSize, setBookings, setTotalCount, setLoading) {
  setLoading(true)

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('bookings')
    .select('id, start_at, end_at, hours_charged, seat_number, resources(name, sites(name))', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', BOOKING_STATUS.CONFIRMED)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .range(from, to)

  if (error) {
    console.error('Error loading bookings:', error)
  } else {
    setBookings(data)
    setTotalCount(count ?? 0)
  }

  setLoading(false)
}

export function UpcomingBookings({ pageSize = 5, onBookingsChanged }) {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [prevPageSize, setPrevPageSize] = useState(pageSize)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  // Reset to page 0 whenever pageSize changes (e.g. resizing across the mobile breakpoint)
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize)
    setPage(0)
  }

  useEffect(() => {
    if (!profile) {
      return
    }

    fetchBookings(profile.id, page, pageSize, setBookings, setTotalCount, setLoading)
  }, [profile, page, pageSize])

  async function handleCancel(booking) {
    const late = isLateCancellation(booking.start_at)

    if (!window.confirm(
      late
        ? "Cancel this booking? It's within 24h of the start time, so the hours will stay charged to your current monthly quota."
        : "Cancel this booking? The hours will be credited back to your current monthly quota."
    )) {
      return
    }

    setCancellingId(booking.id)

    const { error } = await supabase
      .from('bookings')
      .update({
        status: late ? BOOKING_STATUS.CANCELLED_CHARGED : BOOKING_STATUS.CANCELLED_NOT_CHARGED,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (error) {
      console.error('Error cancelling booking:', error)
    } else {
      await fetchBookings(profile.id, page, pageSize, setBookings, setTotalCount, setLoading)
      onBookingsChanged?.()
    }

    setCancellingId(null)
  }

  function handleBooked() {
    fetchBookings(profile.id, page, pageSize, setBookings, setTotalCount, setLoading)
    onBookingsChanged?.()
  }

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming bookings</CardTitle>
        <CardAction>
          <NewBookingDialog onBooked={handleBooked} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bookings</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3">
              {bookings.map((booking) => {
                const late = isLateCancellation(booking.start_at)

                return (
                  <li key={booking.id} className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {booking.resources?.sites?.name} - {booking.resources?.name} Seat {booking.seat_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatBookingRange(booking.start_at, booking.end_at)}
                        <p>
                          {booking.hours_charged} hour{booking.hours_charged > 1 ? 's' : ''} charged
                        </p>
                      </span>
                    </div>
                    <Button
                      variant={late ? "destructive" : "outline"}
                      size="sm"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking)}
                    >
                      {late ? "Cancel without refund" : "Cancel"}
                    </Button>
                  </li>
                )
              })}
            </ul>

            {totalPages > 1 && (
              <div className="grid grid-cols-3 items-center pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  hidden={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="col-start-1 justify-self-start"
                >
                  Previous
                </Button>
                <span className="col-start-2 justify-self-center text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  hidden={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="col-start-3 justify-self-end"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
