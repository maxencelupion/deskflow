import { Spinner } from '@/components/Spinner'
import { useEffect, useState } from 'react'
import { Plus, SquarePen, Trash } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { cn, chipClassName, HOME_DIALOG_CLASSNAME, HOME_INPUT_CLASSNAME } from '@/lib/utils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { BOOKING_STATUS, RESOURCE_TYPE, RESOURCE_TYPES } from '@/lib/enums'
import { getCurrentMonthRange } from '@/lib/dates'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { CountBadge } from '@/components/CountBadge'
import { ResourceTypeBadge } from '@/components/ResourceTypeBadge'


const emptyForm = { id: null, name: '', type: RESOURCE_TYPE.OFFICE, capacity: '1' }

export function ManagerResourcesTable({ pageSize = 5, onResourceChanged }) {
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
      onResourceChanged?.()
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
      onResourceChanged?.()
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{siteName ? `${siteName} ` : ''}resources</h2>
        <button
          type="button"
          onClick={openAddDialog}
          className="home-pill-sm"
        >
          <Plus className="size-4" />
          Add resource
        </button>
      </div>

      <div className="home-card w-full p-5">
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
                      className="home-icon-btn"
                    >
                      <SquarePen className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => handleDelete(resource)}
                      className="home-icon-btn-danger"
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
        <DialogContent className={HOME_DIALOG_CLASSNAME}>
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
                  className={HOME_INPUT_CLASSNAME}
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
                  className={HOME_INPUT_CLASSNAME}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <DialogFooter>
                <button
                  type="submit"
                  disabled={submitting}
                  className="home-pill"
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
