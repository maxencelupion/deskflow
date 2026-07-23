import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/dates'

// Mirrors the booking_status enum in supabase/migrations/20260721131256_schema_init.sql
export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED_NOT_CHARGED: 'cancelled_not_charged',
  CANCELLED_CHARGED: 'cancelled_charged',
}

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CANCELLED_NOT_CHARGED]: 'Cancelled',
  [BOOKING_STATUS.CANCELLED_CHARGED]: 'Cancelled but charged',
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
