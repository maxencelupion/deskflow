import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BOOKING_STATUS_LABELS } from '@/lib/bookings'
import { formatBookingRange } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function fetchSiteBookings(page, pageSize, setBookings, setTotalCount, setLoading) {
  setLoading(true)

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('bookings')
    .select('id, start_at, end_at, hours_charged, seat_number, status, resources(name), profiles(email)', { count: 'exact' })
    .order('start_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error loading site bookings:', error)
  } else {
    setBookings(data)
    setTotalCount(count ?? 0)
  }

  setLoading(false)
}

export function SiteBookings({ pageSize = 5 }) {
  const [bookings, setBookings] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [prevPageSize, setPrevPageSize] = useState(pageSize)
  const [loading, setLoading] = useState(true)

  // Reset to page 0 whenever pageSize changes (e.g. resizing across the mobile breakpoint)
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize)
    setPage(0)
  }

  useEffect(() => {
    fetchSiteBookings(page, pageSize, setBookings, setTotalCount, setLoading)
  }, [page, pageSize])

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site bookings</CardTitle>
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
                  <li key={booking.id} className="flex flex-col gap-0.5 rounded-lg border p-2">
                    <span className="text-sm font-medium">
                      {booking.resources?.name}  Seat {booking.seat_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatBookingRange(booking.start_at, booking.end_at)} - {booking.profiles?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </li>
                ))
              )}
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
