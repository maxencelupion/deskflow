import { Spinner } from '@/components/Spinner'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { groupConsecutiveBy } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { formatGreetingDate, formatTimeRange, toDateInputValue } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'

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
                {group.items.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 rounded-2xl border border-home-border bg-home-card px-5 py-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.12)] transition-shadow hover:shadow-[0_8px_20px_-8px_rgba(17,17,17,0.2)]"
                  >
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold">
                        {booking.resources?.name} : Seat {booking.seat_number}
                      </div>
                      <div className="text-sm text-home-muted">
                        {formatTimeRange(booking.start_at, booking.end_at)} - {booking.profiles?.email} - {booking.hours_charged} hour{booking.hours_charged > 1 ? 's' : ''}
                      </div>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
