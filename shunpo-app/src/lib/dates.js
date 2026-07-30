export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getCurrentMonthRange(now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return { startOfMonth, startOfNextMonth }
}

export function lastDayOfCurrentMonth() {
  const { startOfNextMonth } = getCurrentMonthRange()

  return toDateInputValue(new Date(startOfNextMonth.getTime() - 1))
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

// Trims a Postgres "HH:MM:SS" time value down to "HH:MM"
export function toTimeInputValue(time) {
  return time?.slice(0, 5)
}

export function generateHourlySlots(opensAt, closesAt) {
  const [openH, openM] = toTimeInputValue(opensAt).split(':').map(Number)
  const [closeH, closeM] = toTimeInputValue(closesAt).split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  const slots = []
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += 60) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0')
    const m = String(minutes % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
  }

  return slots
}

const weekdayDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
const shortMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
const longMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' })
const greetingDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

export function formatDateTime(date) {
  return `${weekdayDateFormatter.format(date)}, ${timeFormatter.format(date)}`
}

export function formatTimeRange(startAt, endAt) {
  const start = new Date(startAt)
  const end = new Date(endAt)

  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
}

// Month/day for the small date block shown next to booking cards
export function formatDateBlock(dateInput) {
  const date = new Date(dateInput)

  return {
    month: shortMonthFormatter.format(date),
    day: String(date.getDate()).padStart(2, '0'),
  }
}

export function formatMonthLong(date = new Date()) {
  return longMonthFormatter.format(date)
}

export function formatGreetingDate(date = new Date()) {
  return greetingDateFormatter.format(date)
}
