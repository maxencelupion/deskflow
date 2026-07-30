import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS_LABELS } from '@/lib/enums'
import { formatDateBlock, formatTimeRange } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'

export function ManagerSiteBookings({ pageSize = 5 }) {
  const { profile } = useAuth()
  const siteId = profile?.site_id

  const [siteName, setSiteName] = useState('')
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!siteId) {
      return
    }

    supabase.from('sites').select('name').eq('id', siteId).single().then(({ data, error }) => {
      if (error) {
        console.error('Error loading site:', error)
      } else {
        setSiteName(data.name)
      }
    })
  }, [siteId])

  const { page, setPage, totalPages, loading } = usePaginatedQuery(
    async (page, pageSize) => {
      if (!siteId) {
        return { count: 0 }
      }

      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from('bookings')
        .select(
          'id, start_at, end_at, hours_charged, seat_number, status, resources!inner(name, site_id), profiles(email)',
          { count: 'exact' }
        )
        .eq('resources.site_id', siteId)
        .order('start_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error loading site bookings:', error)
        return { count: 0 }
      }

      setBookings(data)
      return { count }
    },
    [siteId],
    pageSize
  )

  return (
    <div>
      <h2 className="mb-3.5 text-base font-semibold">{siteName} bookings</h2>
      {loading ? (
        <p className="text-sm text-home-muted">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">No bookings yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {bookings.map((booking) => {
            const dateBlock = formatDateBlock(booking.start_at)

            return (
              <div
                key={booking.id}
                className="flex items-center gap-4 rounded-2xl border border-home-border bg-home-card px-5 py-4"
              >
                <div className="w-13 shrink-0 text-center">
                  <div className="text-[11px] text-home-muted-2 uppercase">{dateBlock.month}</div>
                  <div className="font-heading text-xl font-semibold">{dateBlock.day}</div>
                </div>
                <div className="h-9 w-px bg-home-border" />
                <div className="flex-1">
                  <div className="text-[15px] font-semibold">
                    {booking.resources?.name} : Seat {booking.seat_number}
                  </div>
                  <div className="text-sm text-home-muted">
                    {formatTimeRange(booking.start_at, booking.end_at)} - {booking.profiles?.email} - {booking.hours_charged} hour{booking.hours_charged > 1 ? 's' : ''}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-home-border px-3 py-1 text-xs font-medium text-home-muted">
                  {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </div>
            )
          })}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
