import { useState } from 'react'
import { Plus, SquarePen, Trash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DialogSubmitFooter } from '@/components/ui/dialog-submit-footer'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { DAY_NAMES } from '@/lib/dates'

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

export function ManageSites({ pageSize = 5 }) {
  const [sites, setSites] = useState([])
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
      // profiles.site_id has no cascade/set-null, so a site with an assigned manager can't be deleted
      window.alert(
        deleteError.code === '23503'
          ? 'This site still has a manager assigned to it. Reassign or remove that manager first.'
          : deleteError.message
      )
    } else {
      refetch()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex min-h-8 items-center">
          <CardTitle>Sites</CardTitle>
        </div>
        <CardAction>
          <Button type="button" size="sm" aria-label="Add site" onClick={openAddDialog}>
            <Plus />
            <span className="hidden sm:inline">Add site</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sites.length === 0 ? (
              <li className="flex items-center rounded-lg border border-dashed p-2 text-sm text-muted-foreground">
                No sites yet.
              </li>
            ) : (
              sites.map((site) => (
                <li key={site.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                  <span className="text-sm">{site.name}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Edit" onClick={() => openEditDialog(site)}>
                      <SquarePen />
                    </Button>
                    <Button type="button" variant="destructive" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(site)}>
                      <Trash />
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit site' : 'New site'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="site-name">Name</FieldLabel>
                <Input
                  id="site-name"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>

              {editing && (
                <Field>
                  <FieldLabel>Opening hours</FieldLabel>
                  {weekLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {week.map((day, i) => (
                        <div
                          key={day.day_of_week}
                          className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-24 text-sm font-medium">{DAY_NAMES[day.day_of_week]}</span>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={day.is_closed}
                                onChange={(e) => updateDay(i, { is_closed: e.target.checked })}
                                className="size-4 rounded border-input"
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
                                className="w-20 text-center"
                                required
                              />
                              <span className="text-muted-foreground">–</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                pattern="([01]\d|2[0-3]):[0-5]\d"
                                value={day.closes_at}
                                onChange={(e) => updateDay(i, { closes_at: e.target.value })}
                                className="w-20 text-center"
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

              <DialogSubmitFooter submitting={submitting} label={editing ? 'Save changes' : 'Add site'} />
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
