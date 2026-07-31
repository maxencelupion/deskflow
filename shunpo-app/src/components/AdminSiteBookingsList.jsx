import { Spinner } from '@/components/Spinner'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { groupConsecutiveBy } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { cancelBooking, isLateCancellation } from '@/lib/bookings'
import { formatGreetingDate, formatTimeRange, getCurrentMonthRange, toDateInputValue } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'
import { Pagination } from '@/components/ui/pagination'
import { SiteChipPicker } from '@/components/SiteChipPicker'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { ViewToggle } from '@/components/ViewToggle'
import { BookingsMonthCalendar } from '@/components/BookingsMonthCalendar'

export function AdminSiteBookingsList({ pageSize = 5, sites }) {
  const [siteId, setSiteId] = useState('')
  const [bookings, setBookings] = useState([])
  const [monthBookings, setMonthBookings] = useState([])
  const [cancellingId, setCancellingId] = useState(null)
  const [view, setView] = useState('calendar')

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

  function loadMonthBookings() {
    const { startOfMonth, startOfNextMonth } = getCurrentMonthRange()

    let query = supabase
      .from('bookings')
      .select(
        'id, start_at, end_at, hours_charged, seat_number, status, resources!inner(name, site_id, sites(name)), profiles(email)'
      )
      .gte('start_at', startOfMonth.toISOString())
      .lt('start_at', startOfNextMonth.toISOString())
      .order('start_at', { ascending: true })

    if (siteId) {
      query = query.eq('resources.site_id', siteId)
    }

    query.then(({ data, error }) => {
      if (error) {
        console.error('Error loading month bookings:', error)
      } else {
        setMonthBookings(data)
      }
    })
  }

  useEffect(loadMonthBookings, [siteId])

  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        refetch()
        loadMonthBookings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

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
      loadMonthBookings()
    }

    setCancellingId(null)
  }

  function renderCard(booking) {
    const canCancel = booking.status === BOOKING_STATUS.CONFIRMED && new Date(booking.start_at) > new Date()

    return (
      <div key={booking.id} className="home-booking-card">
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
            className="home-pill-outline"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="home-section-label">Bookings</h2>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="mb-3.5">
        <SiteChipPicker sites={sites} value={siteId} onChange={setSiteId} includeAllOption />
      </div>

      {view === 'calendar' ? (
        <BookingsMonthCalendar
          bookings={monthBookings}
          renderBooking={renderCard}
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
