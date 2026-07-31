import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_NAMES, formatGreetingDate, formatMonthLong, toDateInputValue, toTimeOfDay } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'

const MAX_VISIBLE_PER_DAY = 2

function buildMonthGrid(month) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const startWeekday = new Date(year, monthIndex, 1).getDay()

  const cells = Array(startWeekday).fill(null)

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, monthIndex, day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function BookingsMonthCalendar({ bookings, renderBooking, month, onMonthChange, emptyMessage = 'No bookings on this day.' }) {
  const [today] = useState(() => new Date())
  const [prevMonth, setPrevMonth] = useState(month)
  const [selectedDate, setSelectedDate] = useState(month)

  if (prevMonth !== month) {
    setPrevMonth(month)
    setSelectedDate(month)
  }

  const bookingsByDay = new Map()
  for (const booking of bookings) {
    const key = toDateInputValue(new Date(booking.start_at))
    if (!bookingsByDay.has(key)) {
      bookingsByDay.set(key, [])
    }
    bookingsByDay.get(key).push(booking)
  }
  for (const dayBookings of bookingsByDay.values()) {
    dayBookings.sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
  }

  const todayKey = toDateInputValue(today)
  const selectedDayKey = toDateInputValue(selectedDate)
  const selectedDayBookings = bookingsByDay.get(selectedDayKey) ?? []

  function goToPreviousMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-home-border bg-home-card p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-full border border-home-border p-1 text-home-ink transition-colors hover:bg-home-border"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-semibold">{formatMonthLong(month)} {month.getFullYear()}</div>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-full border border-home-border p-1 text-home-ink transition-colors hover:bg-home-border"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-1 text-center text-[11px] font-medium text-home-muted-2">
              {day.slice(0, 3)}
            </div>
          ))}

          {buildMonthGrid(month).map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-22" />
            }

            const dayKey = toDateInputValue(date)
            const dayBookings = bookingsByDay.get(dayKey) ?? []
            const isToday = dayKey === todayKey
            const isSelected = dayKey === selectedDayKey
            const hiddenCount = dayBookings.length - MAX_VISIBLE_PER_DAY

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex min-h-22 flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-colors",
                  isSelected
                    ? "border-home-ink bg-home-border/40"
                    : "border-home-border/70 hover:bg-home-border/30"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-home-ink text-home-bg" : "text-home-muted"
                  )}
                >
                  {date.getDate()}
                </span>

                <div className="flex flex-col gap-0.5">
                  {dayBookings.slice(0, MAX_VISIBLE_PER_DAY).map((booking) => {
                    const cancelled = booking.status && booking.status !== BOOKING_STATUS.CONFIRMED

                    return (
                      <span
                        key={booking.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                          cancelled ? "bg-home-border/50 text-home-muted-2 line-through" : "bg-home-border text-home-ink"
                        )}
                      >
                        {toTimeOfDay(new Date(booking.start_at))} - {booking.resources?.name}
                      </span>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <span className="px-1 text-[10px] text-home-muted-2">+{hiddenCount} more</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="home-group-label mb-1">{formatGreetingDate(selectedDate)}</div>
        {selectedDayBookings.length === 0 ? (
          <p className="py-2 text-sm text-home-muted-2">{emptyMessage}</p>
        ) : (
          selectedDayBookings.map(renderBooking)
        )}
      </div>
    </div>
  )
}
