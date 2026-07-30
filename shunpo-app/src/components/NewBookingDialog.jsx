import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { fetchMonthlyUsedHours, fetchResourceBookings, createBooking } from '@/lib/bookings'
import {
  DAY_NAMES,
  lastDayOfCurrentMonth,
  getDayOfWeek,
  toDateInputValue,
  combineDateAndTime,
  toTimeOfDay,
  toTimeInputValue,
  generateHourlySlots,
  formatDateTime,
} from '@/lib/dates'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const INPUT_CLASSNAME = "border-home-border bg-home-card text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"

function chipClassName(active) {
  return cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-home-ink bg-home-ink text-home-bg"
      : "border-home-border bg-home-card text-home-ink hover:bg-home-border"
  )
}

export function NewBookingDialog({ onBooked }) {
  const { profile } = useAuth()

  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState([])
  const [siteId, setSiteId] = useState('')
  const [resources, setResources] = useState([])
  const [resourceId, setResourceId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [hours, setHours] = useState('1')
  const [dayBookings, setDayBookings] = useState([])
  const [usedHours, setUsedHours] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  function resetTimeSelection() {
    setStartTime('')
    setHours('1')
  }

  function openDialog() {
    setSiteId('')
    setResourceId('')
    setDate('')
    resetTimeSelection()
    setError(null)
    setNow(Date.now())
    setOpen(true)
  }

  useEffect(() => {
    if (!open || sites.length > 0) {
      return
    }

    async function loadSites() {
      const { data, error } = await supabase.from('sites').select('id, name').order('name')

      if (error) {
        console.error('Error loading sites:', error)
      } else {
        setSites(data)
      }
    }

    loadSites()
  }, [open, sites.length])

  useEffect(() => {
    if (!profile || !open) {
      return
    }

    fetchMonthlyUsedHours(profile.id)
      .then(setUsedHours)
      .catch((fetchError) => console.error('Error loading monthly usage:', fetchError))
  }, [profile, open])

  useEffect(() => {
    if (!siteId) {
      return
    }

    async function loadSiteDetails() {
      const [resourcesResult, weeklyHoursResult] = await Promise.all([
        supabase.from('resources').select('id, name, type, capacity').eq('site_id', siteId).order('name'),
        supabase.from('site_weekly_hours').select('day_of_week, is_closed, opens_at, closes_at').eq('site_id', siteId),
      ])

      if (resourcesResult.error) {
        console.error('Error loading resources:', resourcesResult.error)
      } else {
        setResources(resourcesResult.data)
      }

      if (weeklyHoursResult.error) {
        console.error('Error loading weekly hours:', weeklyHoursResult.error)
      } else {
        setWeeklyHours(weeklyHoursResult.data)
      }

      setResourceId('')
    }

    loadSiteDetails()
  }, [siteId])

  useEffect(() => {
    if (!resourceId || !date) {
      return
    }

    const rangeStart = combineDateAndTime(date, '00:00')
    const rangeEnd = new Date(rangeStart.getTime() + 24 * 3600000)

    fetchResourceBookings({ resourceId, rangeStart, rangeEnd })
      .then(setDayBookings)
      .catch((fetchError) => console.error('Error loading availability:', fetchError))
  }, [resourceId, date])

  function findHoursForDay(dayOfWeek) {
    return weeklyHours.find((h) => h.day_of_week === dayOfWeek)
  }

  function isDayClosed(hoursForThatDay) {
    return Boolean(hoursForThatDay?.is_closed) || (weeklyHours.length > 0 && !hoursForThatDay)
  }

  const todayStr = toDateInputValue(new Date())
  const isToday = date === todayStr

  const dayOfWeek = date ? getDayOfWeek(date) : null
  const hoursForDay = findHoursForDay(dayOfWeek)
  const timeSlots = hoursForDay && !hoursForDay.is_closed
    ? generateHourlySlots(hoursForDay.opens_at, hoursForDay.closes_at)
      .filter((slot) => !isToday || combineDateAndTime(date, slot).getTime() > now)
    : []
  const start = startTime ? combineDateAndTime(date, startTime) : null
  const hoursNum = parseFloat(hours) || 0
  const hoursNotInteger = hours !== '' && !Number.isInteger(hoursNum)
  const end = start && hoursNum > 0 ? new Date(start.getTime() + hoursNum * 3600000) : null
  const remaining = usedHours !== null ? (profile?.monthly_quota_hours ?? 0) - usedHours : null

  const siteClosed = Boolean(date) && isDayClosed(hoursForDay)
  const sameDayEnd = Boolean(end) && toDateInputValue(end) === date

  const outsideOpeningHours = Boolean(
    hoursForDay && !hoursForDay.is_closed && start && end &&
    (!sameDayEnd || toTimeOfDay(end) > toTimeInputValue(hoursForDay.closes_at))
  )
  const exceedsQuota = remaining !== null && hoursNum > remaining

  const canSubmit = Boolean(
    siteId && resourceId && startTime && hoursNum > 0 && !hoursNotInteger &&
    !siteClosed && !outsideOpeningHours && !exceedsQuota
  )

  const resourceCapacity = resources.find((r) => r.id === resourceId)?.capacity ?? 1

  function seatsBookedDuring(segmentStart, segmentEnd) {
    return dayBookings.filter((b) => new Date(b.start_at) < segmentEnd && new Date(b.end_at) > segmentStart).length
  }

  // A slot is bookable if every hour of the requested duration still has a free seat
  function isSlotBookable(slot) {
    const duration = hoursNum > 0 ? Math.ceil(hoursNum) : 1
    const slotStart = combineDateAndTime(date, slot)

    return Array.from({ length: duration }, (_, i) => i).every((i) => {
      const segmentStart = new Date(slotStart.getTime() + i * 3600000)
      const segmentEnd = new Date(segmentStart.getTime() + 3600000)
      return seatsBookedDuring(segmentStart, segmentEnd) < resourceCapacity
    })
  }

  const maxDateStr = lastDayOfCurrentMonth()

  const showResourceField = Boolean(siteId)
  const showDateField = showResourceField && Boolean(resourceId)
  const showStartTimeField = showDateField && Boolean(date)
  const showHoursField = showStartTimeField && Boolean(startTime)
  const showEndField = showHoursField && hoursNum > 0

  function isClosedWeekday(day) {
    return isDayClosed(findHoursForDay(day.getDay()))
  }

  function isDateDisabled(day) {
    const dayStr = toDateInputValue(day)
    if (dayStr < todayStr || dayStr > maxDateStr) {
      return true
    }

    return isClosedWeekday(day)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!canSubmit) {
      return
    }

    if (start.getTime() < Date.now()) {
      setError('Start time must be in the future.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: submitError } = await createBooking({ resourceId, startAt: start, hours: hoursNum })

    if (submitError) {
      if (submitError.code === '23P01') {
        setError('That slot was just taken, please try a different time.')
      } else {
        setError(submitError.message)
      }
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setOpen(false)
      onBooked?.()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-full bg-home-ink px-5 py-2.5 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80"
      >
        New booking
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-none bg-home-bg text-home-ink ring-home-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-home-ink">New booking</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-home-ink">Site</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => { setSiteId(site.id); resetTimeSelection() }}
                      aria-pressed={siteId === site.id}
                      className={chipClassName(siteId === site.id)}
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              </Field>

              {showResourceField && (
                <Field>
                  <FieldLabel className="text-home-ink">Resource</FieldLabel>
                  {resources.length === 0 ? (
                    <FieldDescription className="text-home-muted">
                      No resources available for this site.
                    </FieldDescription>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {resources.map((resource) => (
                        <button
                          key={resource.id}
                          type="button"
                          onClick={() => { setResourceId(resource.id); resetTimeSelection() }}
                          aria-pressed={resourceId === resource.id}
                          className={chipClassName(resourceId === resource.id)}
                        >
                          {resource.name} ({resource.type}), cap. {resource.capacity}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
              )}

              {showDateField && (
                <Field>
                  <FieldLabel htmlFor="date" className="text-home-ink">Date</FieldLabel>
                  <Calendar
                    id="date"
                    mode="single"
                    selected={date ? combineDateAndTime(date, '00:00') : undefined}
                    onSelect={(day) => {
                      if (!day) return
                      setDate(toDateInputValue(day))
                      resetTimeSelection()
                      setNow(Date.now())
                    }}
                    startMonth={new Date()}
                    endMonth={combineDateAndTime(maxDateStr, '00:00')}
                    hideNavigation
                    disabled={isDateDisabled}
                    modifiers={{ closed: isClosedWeekday }}
                    modifiersClassNames={{ closed: 'text-red-500!' }}
                    className="w-fit rounded-lg border border-home-border p-2 [--cell-size:--spacing(6)]"
                  />
                  {siteClosed && (
                    <FieldError>This site is closed on {DAY_NAMES[dayOfWeek]}.</FieldError>
                  )}
                  {!siteClosed && hoursForDay && (
                    <FieldDescription className="text-home-muted">
                      Open {toTimeInputValue(hoursForDay.opens_at)}–{toTimeInputValue(hoursForDay.closes_at)} on {DAY_NAMES[dayOfWeek]}.
                    </FieldDescription>
                  )}
                </Field>
              )}

              {showStartTimeField && (
                <Field>
                  <FieldLabel htmlFor="startTime" className="text-home-ink">Start time</FieldLabel>
                  {siteClosed && (
                    <FieldError>Site is closed on {DAY_NAMES[dayOfWeek]}.</FieldError>
                  )}
                  {!siteClosed && timeSlots.length === 0 && (
                    <FieldDescription className="text-home-muted">No slots available for this day.</FieldDescription>
                  )}
                  {!siteClosed && timeSlots.length > 0 && (
                    <div id="startTime" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {timeSlots.map((slot) => {
                        const bookable = isSlotBookable(slot)

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setStartTime(slot)}
                            disabled={!bookable}
                            aria-pressed={startTime === slot}
                            className={cn(
                              "rounded-lg border px-1.5 py-1 text-sm transition-colors",
                              startTime === slot
                                ? "border-home-ink bg-home-ink text-home-bg"
                                : "border-home-border bg-home-card hover:bg-home-border",
                              !bookable && "cursor-not-allowed border-home-border/50 text-home-muted-3 opacity-50 line-through hover:bg-home-card"
                            )}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Field>
              )}

              {showHoursField && (
                <Field>
                  <FieldLabel htmlFor="hours" className="text-home-ink">Hours</FieldLabel>
                  <Input
                    id="hours"
                    type="number"
                    step="1"
                    min="1"
                    max={remaining}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    aria-invalid={exceedsQuota || hoursNotInteger}
                    required
                    className={INPUT_CLASSNAME}
                  />
                </Field>
              )}

              {showEndField && (
                <Field>
                  <FieldLabel htmlFor="end" className="text-home-ink">Estimated end</FieldLabel>
                  <Input
                    id="end"
                    readOnly
                    disabled
                    value={end ? formatDateTime(end) : ''}
                    className={INPUT_CLASSNAME}
                  />
                </Field>
              )}

              {hoursNotInteger && (
                <FieldError>Duration must be a whole number of hours.</FieldError>
              )}
              {outsideOpeningHours && (
                <FieldError>This booking would fall outside opening hours.</FieldError>
              )}
              {exceedsQuota && (
                <FieldError>This would exceed your remaining quota this month.</FieldError>
              )}
              {showEndField && !exceedsQuota && remaining !== null && (
                <FieldDescription className="text-home-muted">
                  This booking will use {hoursNum}h - {remaining}h remaining this month.
                </FieldDescription>
              )}

              {error && (
                <FieldError className="text-center">{error}</FieldError>
              )}

              <DialogFooter>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="rounded-full bg-home-ink px-5 py-2.5 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {submitting ? '...' : 'Confirm booking'}
                </button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
