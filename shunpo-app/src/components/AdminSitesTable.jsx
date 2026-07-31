import { useState } from 'react'
import { SquarePen, Trash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { HOME_DIALOG_CLASSNAME, HOME_INPUT_CLASSNAME } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DAY_NAMES } from '@/lib/dates'
import { BOOKING_STATUS } from '@/lib/enums'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { CountBadge } from '@/components/CountBadge'
import { Spinner } from '@/components/Spinner'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/


const emptyForm = { id: null, name: '' }

function buildFullWeek(existingRows) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = existingRows.find((row) => row.day_of_week === dayOfWeek)

    return {
      day_of_week: dayOfWeek,
      is_closed: existing ? existing.is_closed : true,
      opens_at: existing?.opens_at?.slice(0, 5) ?? '',
      closes_at: existing?.closes_at?.slice(0, 5) ?? '',
    }
  })
}

export function AdminSitesTable({ pageSize = 5, onSiteAdded }) {
  const [sites, setSites] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [week, setWeek] = useState([])
  const [weekLoading, setWeekLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error: fetchError, count } = await supabase
        .from('sites')
        .select('id, name', { count: 'exact' })
        .order('name')
        .range(from, to)

      if (fetchError) {
        console.error('Error loading sites:', fetchError)
        return { count: 0 }
      }

      setSites(data)

      const siteIds = data.map((site) => site.id)

      if (siteIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('resources!inner(site_id)')
          .in('resources.site_id', siteIds)
          .eq('status', BOOKING_STATUS.CONFIRMED)
          .gte('start_at', new Date().toISOString())

        if (bookingsError) {
          console.error('Error loading booking counts:', bookingsError)
        } else {
          const counts = {}
          for (const booking of bookingsData) {
            const siteId = booking.resources.site_id
            counts[siteId] = (counts[siteId] ?? 0) + 1
          }
          setBookingCounts(counts)
        }
      } else {
        setBookingCounts({})
      }

      return { count }
    },
    [],
    pageSize
  )

  const editing = form.id !== null

  function openAddDialog() {
    setForm(emptyForm)
    setWeek([])
    setError(null)
    setOpen(true)
  }

  async function openEditDialog(site) {
    setForm({ id: site.id, name: site.name })
    setError(null)
    setOpen(true)
    setWeekLoading(true)

    const { data, error: fetchError } = await supabase
      .from('site_weekly_hours')
      .select('day_of_week, is_closed, opens_at, closes_at')
      .eq('site_id', site.id)

    if (fetchError) {
      console.error('Error loading weekly hours:', fetchError)
      setWeek(buildFullWeek([]))
    } else {
      setWeek(buildFullWeek(data))
    }

    setWeekLoading(false)
  }

  function updateDay(index, changes) {
    setWeek((current) => current.map((day, i) => (i === index ? { ...day, ...changes } : day)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (editing) {
      const invalidDay = week.find((day) => {
        if (day.is_closed) {
          return false
        }

        if (!TIME_RE.test(day.opens_at) || !TIME_RE.test(day.closes_at)) {
          return true
        }

        return day.closes_at <= day.opens_at
      })

      if (invalidDay) {
        setError(`${DAY_NAMES[invalidDay.day_of_week]}: enter valid opening and closing times (HH:MM), with closing after opening.`)
        return
      }
    }

    setSubmitting(true)

    function fail(message) {
      setError(message)
      setSubmitting(false)
    }

    const payload = { name: form.name }

    const { error: submitError } = form.id
      ? await supabase.from('sites').update(payload).eq('id', form.id)
      : await supabase.from('sites').insert(payload)

    if (submitError) {
      return fail(submitError.code === '23505' ? 'A site with this name already exists.' : submitError.message)
    }

    if (editing) {
      const hoursPayload = week.map((day) => ({
        site_id: form.id,
        day_of_week: day.day_of_week,
        is_closed: day.is_closed,
        opens_at: day.is_closed ? null : day.opens_at,
        closes_at: day.is_closed ? null : day.closes_at,
      }))

      const { error: hoursError } = await supabase
        .from('site_weekly_hours')
        .upsert(hoursPayload, { onConflict: 'site_id,day_of_week' })

      if (hoursError) {
        return fail(hoursError.message)
      }
    }

    refetch()
    onSiteAdded?.()

    setOpen(false)
    setForm(emptyForm)
    setWeek([])
    setSubmitting(false)
  }

  async function handleDelete(site) {
    if (!window.confirm(`Delete "${site.name}"? This will also permanently delete all of its resources and their bookings.`)) {
      return
    }

    const { error: deleteError } = await supabase.from('sites').delete().eq('id', site.id)

    if (deleteError) {
      console.error('Error deleting site:', deleteError)
      window.alert(
        deleteError.code === '23503'
          ? 'This site still has a manager assigned to it. Reassign or remove that manager first.'
          : deleteError.message
      )
    } else {
      refetch()
      onSiteAdded?.()
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="home-section-label">Sites</h2>
        <button
          type="button"
          onClick={openAddDialog}
          className="home-pill-sm"
        >
          Add site
        </button>
      </div>

      <div className="home-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center px-5 py-6"><Spinner /></div>
        ) : sites.length === 0 ? (
          <p className="px-5 py-4 text-sm text-home-muted-2">No sites yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-home-border text-left text-xs font-semibold tracking-wide text-home-muted uppercase">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Upcoming booking</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className="border-b border-home-border odd:bg-home-card even:bg-home-bg/50 last:border-0 hover:bg-home-border/40! transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{site.name}</td>
                    <td className="px-5 py-3"><CountBadge count={bookingCounts[site.id]} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => openEditDialog(site)}
                          className="home-icon-btn"
                        >
                          <SquarePen className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => handleDelete(site)}
                          className="home-icon-btn-danger"
                        >
                          <Trash className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`max-h-[85vh] overflow-y-auto sm:max-w-lg ${HOME_DIALOG_CLASSNAME}`}>
          <DialogHeader>
            <DialogTitle className="text-home-ink">{editing ? 'Edit site' : 'New site'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="site-name" className="text-home-ink">Name</FieldLabel>
                <Input
                  id="site-name"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={HOME_INPUT_CLASSNAME}
                />
              </Field>

              {editing && (
                <Field>
                  <FieldLabel className="text-home-ink">Opening hours</FieldLabel>
                  {weekLoading ? (
                    <div className="flex justify-center py-2"><Spinner className="size-4" /></div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {week.map((day, i) => (
                        <div
                          key={day.day_of_week}
                          className="flex flex-col gap-2 rounded-lg border border-home-border p-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-24 text-sm font-medium">{DAY_NAMES[day.day_of_week]}</span>
                            <label className="flex items-center gap-1.5 text-xs text-home-muted">
                              <input
                                type="checkbox"
                                checked={day.is_closed}
                                onChange={(e) => updateDay(i, { is_closed: e.target.checked })}
                                className="size-4 rounded border-home-border"
                              />
                              Closed
                            </label>
                          </div>
                          {!day.is_closed && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                pattern="([01]\d|2[0-3]):[0-5]\d"
                                value={day.opens_at}
                                onChange={(e) => updateDay(i, { opens_at: e.target.value })}
                                className={`w-20 text-center ${HOME_INPUT_CLASSNAME}`}
                                required
                              />
                              <span className="text-home-muted">–</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                pattern="([01]\d|2[0-3]):[0-5]\d"
                                value={day.closes_at}
                                onChange={(e) => updateDay(i, { closes_at: e.target.value })}
                                className={`w-20 text-center ${HOME_INPUT_CLASSNAME}`}
                                required
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              )}

              {error && <FieldError>{error}</FieldError>}

              <DialogFooter>
                <button
                  type="submit"
                  disabled={submitting}
                  className="home-pill"
                >
                  {submitting ? '...' : editing ? 'Save changes' : 'Add site'}
                </button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
