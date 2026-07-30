import { Spinner } from '@/components/Spinner'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { groupConsecutiveBy } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { cancelBooking, isLateCancellation } from '@/lib/bookings'
import { formatGreetingDate, formatTimeRange, toDateInputValue } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'
import { Pagination } from '@/components/ui/pagination'
import { SiteChipPicker } from '@/components/SiteChipPicker'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'

export function AdminSiteBookingsList({ pageSize = 5, sites }) {
  const [siteId, setSiteId] = useState('')
  const [bookings, setBookings] = useState([])
  const [cancellingId, setCancellingId] = useState(null)

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      const from = page * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('bookings')
        .select(
          'id, start_at, end_at, hours_charged, seat_number, status, resources!inner(name, site_id, sites(name)), profiles(email)',
          { count: 'exact' }
        )
        .order('start_at', { ascending: false })
        .range(from, to)

      if (siteId) {
        query = query.eq('resources.site_id', siteId)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error loading bookings:', error)
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
    <div>
      <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-home-muted">Bookings</h2>

      <div className="mb-3.5">
        <SiteChipPicker sites={sites} value={siteId} onChange={setSiteId} includeAllOption />
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">No bookings yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupConsecutiveBy(bookings, (b) => toDateInputValue(new Date(b.start_at))).map((group) => (
            <div key={group.key}>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-home-muted-2">
                {formatGreetingDate(new Date(group.items[0].start_at))}
              </div>
              <div className="flex flex-col gap-2.5">
                {group.items.map((booking) => {
                  const canCancel = booking.status === BOOKING_STATUS.CONFIRMED && new Date(booking.start_at) > new Date()

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 rounded-2xl border border-home-border bg-home-card px-5 py-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.12)] transition-shadow hover:shadow-[0_8px_20px_-8px_rgba(17,17,17,0.2)]"
                    >
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold">
                          {booking.resources?.sites?.name} · {booking.resources?.name} · Seat {booking.seat_number}
                        </div>
                        <div className="text-sm text-home-muted">
                          {formatTimeRange(booking.start_at, booking.end_at)} - {booking.profiles?.email} -{' '}
                          {booking.hours_charged} hour{booking.hours_charged > 1 ? 's' : ''}
                        </div>
                        <div className="mt-1.5">
                          <BookingStatusBadge status={booking.status} />
                        </div>
                      </div>
                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancel(booking)}
                          className="rounded-full border border-home-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-home-border disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
