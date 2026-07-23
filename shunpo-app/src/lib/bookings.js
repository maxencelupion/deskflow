import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/dates'

export async function fetchMonthlyUsedHours(userId) {
  const { startOfMonth, startOfNextMonth } = getCurrentMonthRange()

  const { data, error } = await supabase
    .from('bookings')
    .select('hours_charged')
    .eq('user_id', userId)
    .in('status', ['confirmed', 'cancelled_charged'])
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
