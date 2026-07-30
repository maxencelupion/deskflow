import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { usePageSize } from '@/hooks/usePageSize'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { cancelBooking, fetchMonthlyUsedHours, isLateCancellation } from '@/lib/bookings'
import { formatGreetingDate, getCurrentMonthRange } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'
import { NewBookingDialog } from '@/components/NewBookingDialog'
import { MonthlyQuota } from '@/components/MonthlyQuota'
import { NextBookingCard } from '@/components/NextBookingCard'
import { UpcomingBookings } from '@/components/UpcomingBookings'

export default function UserDashboard() {
  const { profile } = useAuth()
  const pageSize = usePageSize()

  const [bookings, setBookings] = useState([])
  const [nextBooking, setNextBooking] = useState(null)
  const [usedHours, setUsedHours] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [summaryReloadKey, setSummaryReloadKey] = useState(0)

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

  useEffect(() => {
    if (!profile) {
      return
    }

    let cancelled = false

    Promise.all([
      supabase
        .from('bookings')
        .select('id, start_at, end_at, hours_charged, seat_number, resources(name, sites(name))')
        .eq('user_id', profile.id)
        .eq('status', BOOKING_STATUS.CONFIRMED)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1),
      fetchMonthlyUsedHours(profile.id).catch((error) => {
        console.error('Error loading monthly usage:', error)
        return null
      }),
    ]).then(([nextResult, used]) => {
      if (cancelled) {
        return
      }

      if (nextResult.error) {
        console.error('Error loading next booking:', nextResult.error)
      } else {
        setNextBooking(nextResult.data[0] ?? null)
      }

      setUsedHours(used)
    })

    return () => {
      cancelled = true
    }
  }, [profile, summaryReloadKey])

  function handleDataChanged() {
    setSummaryReloadKey((k) => k + 1)
    refetch()
  }

  async function handleCancel(booking) {
    const late = isLateCancellation(booking.start_at)

    if (!window.confirm(
      late
        ? "Cancel this booking? It's within 24h of the start time, so the hours will stay charged to your current monthly quota."
        : 'Cancel this booking? The hours will be credited back to your current monthly quota.'
    )) {
      return
    }

    setCancellingId(booking.id)

    const { error } = await cancelBooking(booking)

    if (error) {
      console.error('Error cancelling booking:', error)
    } else {
      handleDataChanged()
    }

    setCancellingId(null)
  }

  const quotaTotal = profile?.monthly_quota_hours ?? 0
  const quotaUsed = usedHours ?? 0
  const quotaRemaining = Math.max(quotaTotal - quotaUsed, 0)
  const quotaPercent = quotaTotal > 0 ? Math.min(100, Math.round((quotaUsed / quotaTotal) * 100)) : 0

  const { startOfNextMonth } = getCurrentMonthRange()
  const daysUntilReset = Math.ceil((startOfNextMonth - new Date()) / (1000 * 60 * 60 * 24))
  const resetText = daysUntilReset <= 0 ? 'today' : daysUntilReset === 1 ? 'in 1 day' : `in ${daysUntilReset} days`

  return (
    <div className="flex-1 bg-home-bg text-home-ink">
      <div className="mx-auto max-w-300 px-6 py-9 md:px-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold">{formatGreetingDate()}</h1>
            <p className="mt-1 text-sm text-home-muted">Book your next rooms and offices for this month.</p>
          </div>
          <NewBookingDialog onBooked={handleDataChanged} />
        </div>

        <div className="mb-8 h-55 w-full overflow-hidden rounded-2xl shadow-[0_8px_24px_-8px_rgba(17,17,17,0.25)]">
          <img src="/user_dashboard.jpg" alt="" className="h-full w-full object-cover" />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <MonthlyQuota
            quotaUsed={quotaUsed}
            quotaTotal={quotaTotal}
            quotaRemaining={quotaRemaining}
            quotaPercent={quotaPercent}
            resetText={resetText}
          />
          <NextBookingCard booking={nextBooking} />
        </div>

        <UpcomingBookings
          bookings={bookings}
          loading={loading}
          cancellingId={cancellingId}
          onCancel={handleCancel}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
