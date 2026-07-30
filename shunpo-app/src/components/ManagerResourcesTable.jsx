import { useEffect, useState } from 'react'
import { Plus, SquarePen, Trash } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS, RESOURCE_TYPE, RESOURCE_TYPES } from '@/lib/enums'
import { getCurrentMonthRange } from '@/lib/dates'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'

const INPUT_CLASSNAME = "border-home-border bg-home-card text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"

const emptyForm = { id: null, name: '', type: RESOURCE_TYPE.OFFICE, capacity: '1' }

function chipClassName(active) {
  return cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-home-ink bg-home-ink text-home-bg"
      : "border-home-border bg-home-card text-home-ink hover:bg-home-border"
  )
}

export function ManagerResourcesTable({ pageSize = 5 }) {
  const { profile } = useAuth()
  const siteId = profile?.site_id

  const [siteName, setSiteName] = useState('')
  const [resources, setResources] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!siteId) {
      return
    }

    supabase.from('sites').select('name').eq('id', siteId).single().then(({ data, error: fetchError }) => {
      if (fetchError) {
        console.error('Error loading site:', fetchError)
      } else {
        setSiteName(data.name)
      }
    })
  }, [siteId])

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      if (!siteId) {
        return { count: 0 }
      }

      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error: fetchError, count } = await supabase
        .from('resources')
        .select('id, name, type, capacity', { count: 'exact' })
        .eq('site_id', siteId)
        .order('name')
        .range(from, to)

      if (fetchError) {
        console.error('Error loading resources:', fetchError)
        return { count: 0 }
      }

      setResources(data)

      const resourceIds = data.map((resource) => resource.id)

      if (resourceIds.length > 0) {
        const { startOfNextMonth } = getCurrentMonthRange()

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('resource_id')
          .in('resource_id', resourceIds)
          .eq('status', BOOKING_STATUS.CONFIRMED)
          .gte('start_at', new Date().toISOString())
          .lt('start_at', startOfNextMonth.toISOString())

        if (bookingsError) {
          console.error('Error loading booking counts:', bookingsError)
        } else {
          const counts = {}
          for (const booking of bookingsData) {
            counts[booking.resource_id] = (counts[booking.resource_id] ?? 0) + 1
          }
          setBookingCounts(counts)
        }
      } else {
        setBookingCounts({})
      }

      return { count }
    },
    [siteId],
    pageSize
  )

  const editing = form.id !== null

  function openAddDialog() {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  function openEditDialog(resource) {
    setForm({ id: resource.id, name: resource.name, type: resource.type, capacity: String(resource.capacity) })
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      type: form.type,
      capacity: parseInt(form.capacity, 10),
    }

    const { error: submitError } = form.id
      ? await supabase.from('resources').update(payload).eq('id', form.id)
      : await supabase.from('resources').insert({ ...payload, site_id: siteId })

    if (submitError) {
      if (submitError.code === '23505') {
        setError('A resource with this name already exists on this site.')
      } else {
        setError(submitError.message)
      }
    } else {
      refetch()
      setOpen(false)
      setForm(emptyForm)
    }

    setSubmitting(false)
  }

  async function handleDelete(resource) {
    if (!window.confirm(`Delete "${resource.name}"? This will also permanently delete all of its bookings.`)) {
      return
    }

    const { error: deleteError } = await supabase.from('resources').delete().eq('id', resource.id)

    if (deleteError) {
      console.error('Error deleting resource:', deleteError)
    } else {
      refetch()
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{siteName ? `${siteName} ` : ''}resources</h2>
        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1.5 rounded-full bg-home-ink px-4 py-2 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80"
        >
          <Plus className="size-4" />
          Add resource
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-home-border bg-home-card">
        {loading ? (
          <p className="px-5 py-4 text-sm text-home-muted">Loading...</p>
        ) : resources.length === 0 ? (
          <p className="px-5 py-4 text-sm text-home-muted-2">No resources yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-home-border text-left text-xs font-semibold tracking-wide text-home-muted uppercase">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Incoming booking</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id} className="border-b border-home-border last:border-0">
                    <td className="px-5 py-3 font-medium">{resource.name}</td>
                    <td className="px-5 py-3 text-home-muted capitalize">{resource.type}</td>
                    <td className="px-5 py-3 text-home-muted">{resource.capacity}</td>
                    <td className="px-5 py-3 text-home-muted">
                      {bookingCounts[resource.id] ?? 0}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => openEditDialog(resource)}
                          className="rounded-full border border-home-border p-1.5 text-home-ink transition-colors hover:bg-home-border"
                        >
                          <SquarePen className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => handleDelete(resource)}
                          className="rounded-full border border-home-border p-1.5 text-red-600 transition-colors hover:bg-red-50"
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

        <div className="px-5 py-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-none bg-home-bg text-home-ink ring-home-border">
          <DialogHeader>
            <DialogTitle className="text-home-ink">{editing ? 'Edit resource' : 'New resource'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="resource-name" className="text-home-ink">Name</FieldLabel>
                <Input
                  id="resource-name"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={INPUT_CLASSNAME}
                />
              </Field>

              <Field>
                <FieldLabel className="text-home-ink">Type</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {RESOURCE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        type,
                        capacity: type === RESOURCE_TYPE.OFFICE ? '1' : f.capacity,
                      }))}
                      aria-pressed={form.type === type}
                      className={cn(chipClassName(form.type === type), "capitalize")}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="resource-capacity" className="text-home-ink">Capacity</FieldLabel>
                <Input
                  id="resource-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.capacity}
                  disabled={form.type === RESOURCE_TYPE.OFFICE}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  required
                  className={INPUT_CLASSNAME}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <DialogFooter>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-home-ink px-5 py-2.5 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {submitting ? '...' : editing ? 'Save changes' : 'Add resource'}
                </button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
