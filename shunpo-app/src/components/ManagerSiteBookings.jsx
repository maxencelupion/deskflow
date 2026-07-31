import { Spinner } from '@/components/Spinner'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { groupConsecutiveBy } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { formatGreetingDate, formatTimeRange, getCurrentMonthRange, toDateInputValue } from '@/lib/dates'
import { Pagination } from '@/components/ui/pagination'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { ViewToggle } from '@/components/ViewToggle'
import { BookingsMonthCalendar } from '@/components/BookingsMonthCalendar'

export function ManagerSiteBookings({ pageSize = 5 }) {
  const { profile } = useAuth()
  const siteId = profile?.site_id

  const [siteName, setSiteName] = useState('')
  const [resourceIds, setResourceIds] = useState([])
  const [bookings, setBookings] = useState([])
  const [monthBookings, setMonthBookings] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [view, setView] = useState('calendar')

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

  useEffect(() => {
    if (!siteId) {
      return
    }

    supabase.from('resources').select('id').eq('site_id', siteId).then(({ data, error }) => {
      if (error) {
        console.error('Error loading site resources:', error)
      } else {
        setResourceIds(data.map((r) => r.id))
      }
    })
  }, [siteId])

  function loadMonthBookings() {
    const { startOfMonth, startOfNextMonth } = getCurrentMonthRange(calendarMonth)

    supabase
      .from('bookings')
      .select('id, start_at, end_at, hours_charged, seat_number, status, resources!inner(name, site_id), profiles(email)')
      .eq('resources.site_id', siteId)
      .gte('start_at', startOfMonth.toISOString())
      .lt('start_at', startOfNextMonth.toISOString())
      .order('start_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading month bookings:', error)
        } else {
          setMonthBookings(data)
        }
      })
  }

  useEffect(() => {
    if (!siteId) {
      return
    }

    loadMonthBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, calendarMonth])

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
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

  useEffect(() => {
    if (resourceIds.length === 0) {
      return
    }

    const channel = supabase
      .channel(`manager-bookings-${siteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `resource_id=in.(${resourceIds.join(',')})` },
        () => {
          refetch()
          loadMonthBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceIds.join(','), calendarMonth])

  function renderCard(booking) {
    return (
      <div key={booking.id} className="home-booking-card">
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
    )
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{siteName} bookings</h2>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'calendar' ? (
        <BookingsMonthCalendar
          bookings={monthBookings}
          renderBooking={renderCard}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          emptyMessage="No upcoming bookings on this day."
        />
      ) : loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <p className="py-4 text-sm text-home-muted-2">No bookings yet.</p>
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
