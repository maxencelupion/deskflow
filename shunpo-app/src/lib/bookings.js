import { supabase } from '@/lib/supabase'

export function getCurrentMonthRange(now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { startOfMonth, startOfNextMonth }
}

export async function fetchMonthlyUsedHours(userId) {
  const { startOfMonth, startOfNextMonth } = getCurrentMonthRange()

  const { data, error } = await supabase
    .from('bookings')
    .select('hours_charged')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('start_at', startOfMonth.toISOString())
    .lt('start_at', startOfNextMonth.toISOString())

  if (error) {
    throw error
  }

  return data.reduce((sum, booking) => sum + booking.hours_charged, 0)
}

export function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function combineDateAndTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`)
}

export function toTimeOfDay(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Calls the book_resource RPC function to create a booking
export async function createBooking({ resourceId, startAt, hours }) {
  return supabase.rpc('book_resource', {
    p_resource_id: resourceId,
    p_start_at: startAt.toISOString(),
    p_hours: hours,
  })
}
