import { Spinner } from '@/components/Spinner'
import { useState } from 'react'
import { SquarePen, Trash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, chipClassName } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS, RESOURCE_TYPE, RESOURCE_TYPES } from '@/lib/enums'
import { getCurrentMonthRange } from '@/lib/dates'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { SiteChipPicker } from '@/components/SiteChipPicker'
import { CountBadge } from '@/components/CountBadge'
import { ResourceTypeBadge } from '@/components/ResourceTypeBadge'

const INPUT_CLASSNAME = "border-home-border bg-home-card text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"

const emptyForm = { id: null, name: '', type: RESOURCE_TYPE.OFFICE, capacity: '1' }

export function AdminResourcesTable({ pageSize = 5, sites, sitesLoading }) {
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const siteId = selectedSiteId || sites[0]?.id || ''

  const [resources, setResources] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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

  if (!sitesLoading && sites.length === 0) {
    return (
      <div>
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-home-muted">Resources</h2>
        <p className="text-sm text-home-muted-2">Create a site first.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-home-muted">Resources</h2>
        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1.5 rounded-full bg-home-ink px-4 py-2 text-sm font-semibold text-home-bg transition-opacity hover:opacity-80"
        >
          Add resource
        </button>
      </div>

      <div className="mb-3.5">
        <SiteChipPicker sites={sites} value={siteId} onChange={setSelectedSiteId} />
      </div>

      <div className="w-full rounded-2xl border border-home-border bg-home-card p-5 shadow-[0_4px_16px_-6px_rgba(17,17,17,0.12)]">
        {loading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : resources.length === 0 ? (
          <p className="text-sm text-home-muted-2">No resources yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-xl border border-home-border bg-home-bg p-5 transition-shadow hover:shadow-[0_8px_20px_-8px_rgba(17,17,17,0.18)]",
                  index % 5 === 0 && "sm:col-span-2"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold">{resource.name}</div>
                    <div className="mt-1 text-xs text-home-muted">Capacity {resource.capacity}</div>
                  </div>
                  <ResourceTypeBadge type={resource.type} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-home-muted">
                    Upcoming <CountBadge count={bookingCounts[resource.id]} />
                  </div>
                  <div className="flex gap-2">
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
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
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
