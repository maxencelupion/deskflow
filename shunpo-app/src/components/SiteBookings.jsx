import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS, BOOKING_STATUS_LABELS, cancelBooking, isLateCancellation } from '@/lib/bookings'
import { formatBookingRange } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'

export function SiteBookings({ pageSize = 5, siteId, siteSelector }) {
  const { profile } = useAuth()
  const canCancel = profile?.role === 'admin'

  const [bookings, setBookings] = useState([])
  const [cancellingId, setCancellingId] = useState(null)

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      const from = page * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('bookings')
        .select('id, start_at, end_at, hours_charged, seat_number, status, resources!inner(name, site_id, sites(name)), profiles(email)', { count: 'exact' })
        .order('start_at', { ascending: false })
        .range(from, to)

      if (siteId) {
        query = query.eq('resources.site_id', siteId)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        console.error('Error loading site bookings:', fetchError)
        return { count: 0 }
      }

      setBookings(data)
      return { count }
    },
    [siteId],
    pageSize
  )

  async function handleCancel(booking) {
    const late = isLateCancellation(booking.start_at)

    if (!window.confirm(
      late
        ? "Cancel this booking? It's within 24h of the start time, so the hours will stay charged to the member's quota."
        : "Cancel this booking? The hours will be credited back to the member's quota."
    )) {
      return
    }

    setCancellingId(booking.id)

    const { error } = await cancelBooking(booking)

    if (error) {
      console.error('Error cancelling booking:', error)
    } else {
      refetch()
    }

    setCancellingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex min-h-8 flex-wrap items-center gap-3">
          <CardTitle>Site bookings</CardTitle>
          {siteSelector && <div className="w-44">{siteSelector}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3">
              {bookings.length === 0 ? (
                <li className="flex items-center rounded-lg border border-dashed p-2 text-sm text-muted-foreground">
                  No bookings yet
                </li>
              ) : (
                bookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {booking.resources?.sites?.name} - {booking.resources?.name} Seat {booking.seat_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatBookingRange(booking.start_at, booking.end_at)} - {booking.profiles?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </div>
                    {canCancel && booking.status === BOOKING_STATUS.CONFIRMED && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={cancellingId === booking.id}
                        onClick={() => handleCancel(booking)}
                      >
                        Cancel
                      </Button>
                    )}
                  </li>
                ))
              )}
            </ul>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
