import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const RESOURCE_TYPES = ['office', 'room']

const emptyForm = { id: null, name: '', type: 'office', capacity: '1' }

async function fetchResources(siteId, page, pageSize, setResources, setTotalCount) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('resources')
    .select('id, name, type, capacity', { count: 'exact' })
    .eq('site_id', siteId)
    .order('name')
    .range(from, to)

  if (error) {
    console.error('Error loading resources:', error)
  } else {
    setResources(data)
    setTotalCount(count ?? 0)
  }
}

export function ManageResources({ pageSize = 5 }) {
  const { profile } = useAuth()
  const [resources, setResources] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [prevPageSize, setPrevPageSize] = useState(pageSize)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize)
    setPage(0)
  }

  useEffect(() => {
    if (!profile?.site_id) {
      return
    }

    fetchResources(profile.site_id, page, pageSize, setResources, setTotalCount).finally(() => setLoading(false))
  }, [profile, page, pageSize])

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

    // Handle both update and insert operations
    const { error: submitError } = form.id
      ? await supabase.from('resources').update(payload).eq('id', form.id)
      : await supabase.from('resources').insert({ ...payload, site_id: profile.site_id })

    if (submitError) {
      if (submitError.code === '23505') {
        setError('A resource with this name already exists on this site.')
      } else {
        setError(submitError.message)
      }
    } else {
      await fetchResources(profile.site_id, page, pageSize, setResources, setTotalCount)
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
      await fetchResources(profile.site_id, page, pageSize, setResources, setTotalCount)
    }
  }

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
        <CardAction>
          <Button type="button" size="sm" onClick={openAddDialog}>
            Add resource
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resources.length === 0 ? (
              <li className="flex items-center rounded-lg border border-dashed p-2 text-sm text-muted-foreground">
                No resources yet.
              </li>
            ) : (
              resources.map((resource) => (
                <li key={resource.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                  <span className="text-sm">
                    {resource.name}{' '}
                    <span className="text-muted-foreground">({resource.type}, capacity {resource.capacity})</span>
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(resource)}>
                      Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(resource)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))
              )}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="grid grid-cols-3 items-center pt-1">
            <Button
              variant="outline"
              size="sm"
              hidden={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="col-start-1 justify-self-start"
            >
              Previous
            </Button>
            <span className="col-start-2 justify-self-center text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              hidden={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="col-start-3 justify-self-end"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit resource' : 'New resource'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="resource-name">Name</FieldLabel>
                <Input
                  id="resource-name"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>

              <Field orientation="horizontal">
                <div className="flex w-full flex-col gap-2">
                  <FieldLabel htmlFor="resource-type">Type</FieldLabel>
                  <Select
                    value={form.type}
                    onValueChange={(value) => setForm((f) => ({
                      ...f,
                      type: value,
                      capacity: value === 'office' ? '1' : f.capacity,
                    }))}
                  >
                    <SelectTrigger id="resource-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <FieldLabel htmlFor="resource-capacity">Capacity</FieldLabel>
                  <Input
                    id="resource-capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={form.capacity}
                    disabled={form.type === 'office'}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    required
                  />
                </div>
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '...' : editing ? 'Save changes' : 'Add resource'}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
