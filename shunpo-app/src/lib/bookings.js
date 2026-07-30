import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'

// 24 hours in milliseconds
const LATE_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

export function isLateCancellation(startAt) {
  // Everything is in milliseconds
  return new Date(startAt).getTime() - Date.now() < LATE_CANCELLATION_WINDOW_MS
}

export async function fetchMonthlyUsedHours(userId) {
  const { startOfMonth, startOfNextMonth } = getCurrentMonthRange()

  const { data, error } = await supabase
    .from('bookings')
    .select('hours_charged')
    .eq('user_id', userId)
    .in('status', [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED_CHARGED])
    .gte('start_at', startOfMonth.toISOString())
    .lt('start_at', startOfNextMonth.toISOString())

  if (error) {
    throw error
  }

  return data.reduce((sum, booking) => sum + booking.hours_charged, 0)
}

export async function createBooking({ resourceId, startAt, hours }) {
  return supabase.rpc('book_resource', {
    p_resource_id: resourceId,
    p_start_at: startAt.toISOString(),
    p_hours: hours,
  })
}

export async function cancelBooking(booking) {
  const late = isLateCancellation(booking.start_at)

  const { error } = await supabase
    .from('bookings')
    .update({
      status: late ? BOOKING_STATUS.CANCELLED_CHARGED : BOOKING_STATUS.CANCELLED_NOT_CHARGED,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', booking.id)

  return { error, late }
}

export async function fetchResourceBookings({ resourceId, rangeStart, rangeEnd }) {
  const { data, error } = await supabase.rpc('get_resource_bookings_for_range', {
    p_resource_id: resourceId,
    p_range_start: rangeStart.toISOString(),
    p_range_end: rangeEnd.toISOString(),
  })

  if (error) {
    throw error
  }

  return data
}
