import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import {
  getCurrentMonthRange,
  fetchMonthlyUsedHours,
  getDayOfWeek,
  toDateInputValue,
  combineDateAndTime,
  toTimeOfDay,
  createBooking,
} from '@/lib/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const endDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const endTimeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' })

function lastDayOfCurrentMonth() {
  const { startOfNextMonth } = getCurrentMonthRange()
  return toDateInputValue(new Date(startOfNextMonth.getTime() - 1))
}

function toTimeInputValue(time) {
  return time?.slice(0, 5)
}

function generateHourlySlots(opensAt, closesAt) {
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

export default function Book() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [sites, setSites] = useState([])
  const [siteId, setSiteId] = useState('')
  const [resources, setResources] = useState([])
  const [resourceId, setResourceId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState([])
  const [date, setDate] = useState(toDateInputValue(new Date()))
  const [startTime, setStartTime] = useState('')
  const [hours, setHours] = useState('')
  const [usedHours, setUsedHours] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase.from('sites').select('id, name').order('name')

      if (error) {
        console.error('Error loading sites:', error)
      } else {
        setSites(data)
      }
    }

    loadSites()
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }

    fetchMonthlyUsedHours(profile.id)
      .then(setUsedHours)
      .catch((fetchError) => console.error('Error loading monthly usage:', fetchError))
  }, [profile])

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

  const dayOfWeek = getDayOfWeek(date)
  const hoursForDay = weeklyHours.find((h) => h.day_of_week === dayOfWeek)
  const timeSlots = hoursForDay && !hoursForDay.is_closed
    ? generateHourlySlots(hoursForDay.opens_at, hoursForDay.closes_at)
    : []
  const start = startTime ? combineDateAndTime(date, startTime) : null
  const hoursNum = parseFloat(hours) || 0
  const hoursNotInteger = hours !== '' && !Number.isInteger(hoursNum)
  const end = start && hoursNum > 0 ? new Date(start.getTime() + hoursNum * 3600000) : null
  const remaining = usedHours !== null ? (profile?.monthly_quota_hours ?? 0) - usedHours : null

  const siteClosed = Boolean(hoursForDay?.is_closed) || (weeklyHours.length > 0 && !hoursForDay)
  const sameDayEnd = Boolean(end && end.getFullYear() === start.getFullYear() && end.getMonth() === start.getMonth() && end.getDate() === start.getDate())

  const outsideOpeningHours = Boolean(
    hoursForDay && !hoursForDay.is_closed && start && end &&
    (!sameDayEnd || toTimeOfDay(end) > toTimeInputValue(hoursForDay.closes_at))
  )
  const exceedsQuota = remaining !== null && hoursNum > remaining

  const canSubmit = Boolean(
    siteId && resourceId && startTime && hoursNum > 0 && !hoursNotInteger &&
    !siteClosed && !outsideOpeningHours && !exceedsQuota
  )

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
      navigate('/')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-10">
      <h1 className="text-2xl font-semibold">New booking</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Book a resource</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="site">Site</FieldLabel>
                <select
                  id="site"
                  className={"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"}
                  value={siteId}
                  onChange={(e) => { setSiteId(e.target.value); setStartTime('') }}
                  required
                >
                  <option value="" disabled>Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="resource">Resource</FieldLabel>
                <select
                  id="resource"
                  className={"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"}
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  disabled={!siteId}
                  required
                >
                  <option value="" disabled>Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type}, capacity {resource.capacity})
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  min={toDateInputValue(new Date())}
                  max={lastDayOfCurrentMonth()}
                  onChange={(e) => { setDate(e.target.value); setStartTime('') }}
                  required
                />
                {siteClosed && siteId && (
                  <FieldDescription className="text-red-500">
                    This site is closed on {DAY_NAMES[dayOfWeek]}.
                  </FieldDescription>
                )}
                {!siteClosed && hoursForDay && (
                  <FieldDescription>
                    Open {toTimeInputValue(hoursForDay.opens_at)}–{toTimeInputValue(hoursForDay.closes_at)} on {DAY_NAMES[dayOfWeek]}.
                  </FieldDescription>
                )}
              </Field>

              <Field orientation="horizontal">
                <div className="flex w-full flex-col gap-2">
                  <FieldLabel htmlFor="startTime">Start time</FieldLabel>
                  <select
                    id="startTime"
                    className={"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={siteClosed || timeSlots.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {siteClosed ? 'Site is closed' : 'Select a time'}
                    </option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <FieldLabel htmlFor="hours">Hours</FieldLabel>
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
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="end">Estimated end</FieldLabel>
                <Input
                  id="end"
                  readOnly
                  disabled
                  value={end ? `${endDateFormatter.format(end)}, ${endTimeFormatter.format(end)}` : ''}
                />
              </Field>

              {hoursNotInteger && (
                <FieldDescription className="text-red-500">
                  Duration must be a whole number of hours.
                </FieldDescription>
              )}
              {outsideOpeningHours && (
                <FieldDescription className="text-red-500">
                  This booking would fall outside opening hours.
                </FieldDescription>
              )}
              {exceedsQuota && (
                <FieldDescription className="text-red-500">
                  This would exceed your remaining quota this month.
                </FieldDescription>
              )}
              {hoursNum > 0 && !exceedsQuota && remaining !== null && (
                <FieldDescription>
                  This booking will use {hoursNum}h — {remaining}h remaining this month.
                </FieldDescription>
              )}

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Field>
                <Button type="submit" disabled={!canSubmit || submitting}>
                  {submitting ? "..." : "Confirm booking"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
