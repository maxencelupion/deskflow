import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS, cancelBooking, isLateCancellation } from '@/lib/bookings'
import { formatBookingRange } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { NewBookingDialog } from '@/components/NewBookingDialog'

export function UpcomingBookings({ pageSize = 5, onBookingsChanged }) {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [cancellingId, setCancellingId] = useState(null)

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      if (!profile) {
        return { count: 0 }
      }

      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from('bookings')
        .select('id, start_at, end_at, hours_charged, seat_number, resources(name, sites(name))', { count: 'exact' })
        .eq('user_id', profile.id)
        .eq('status', BOOKING_STATUS.CONFIRMED)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .range(from, to)

      if (error) {
        console.error('Error loading bookings:', error)
        return { count: 0 }
      }

      setBookings(data)
      return { count }
    },
    [profile?.id ?? ''],
    pageSize
  )

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

    const { error } = await cancelBooking(booking)

    if (error) {
      console.error('Error cancelling booking:', error)
    } else {
      refetch()
      onBookingsChanged?.()
    }

    setCancellingId(null)
  }

  function handleBooked() {
    refetch()
    onBookingsChanged?.()
  }

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
                      size="icon-sm"
                      aria-label={late ? "Cancel without refund" : "Cancel"}
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking)}
                    >
                      <X />
                    </Button>
                  </li>
                )
              })}
            </ul>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
