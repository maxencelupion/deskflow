import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { useSites } from '@/hooks/useSites'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DialogSubmitFooter } from '@/components/ui/dialog-submit-footer'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SitePicker } from '@/components/SitePicker'

const ROLE_LABELS = { member: 'Member', manager: 'Manager', admin: 'Admin' }
const ASSIGNABLE_ROLES = ['member', 'manager']

const emptyForm = { id: null, email: '', role: 'member', site_id: '', monthly_quota_hours: '10' }

export function ManageUsers({ pageSize = 5 }) {
  const [users, setUsers] = useState([])
  const { sites } = useSites()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { page, setPage, totalPages, loading, refetch } = usePaginatedQuery(
    async (page, pageSize) => {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error: fetchError, count } = await supabase
        .from('profiles')
        .select('id, email, role, site_id, monthly_quota_hours, sites(name)', { count: 'exact' })
        .order('email')
        .range(from, to)

      if (fetchError) {
        console.error('Error loading users:', fetchError)
        return { count: 0 }
      }

      setUsers(data)
      return { count }
    },
    [],
    pageSize
  )

  function openEditDialog(user) {
    setForm({
      id: user.id,
      email: user.email,
      role: user.role,
      site_id: user.site_id ?? '',
      monthly_quota_hours: String(user.monthly_quota_hours),
    })
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (form.role === 'manager' && !form.site_id) {
      setError('Select a site for this manager.')
      return
    }

    setSubmitting(true)

    const payload = {
      role: form.role,
      site_id: form.site_id || null,
      monthly_quota_hours: Number(form.monthly_quota_hours),
    }

    // select to check if the update succeeded
    const { data: updated, error: submitError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', form.id)
      .select()
      .single()

    if (submitError || !updated) {
      setError(submitError?.message ?? 'This user could not be updated.')
    } else {
      refetch()
      setOpen(false)
      setForm(emptyForm)
    }

    setSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.length === 0 ? (
              <li className="flex items-center rounded-lg border border-dashed p-2 text-sm text-muted-foreground">
                No users yet.
              </li>
            ) : (
              users.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABELS[user.role] ?? user.role}
                      {user.role === 'manager' && user.sites?.name && ` - ${user.sites.name}`}
                      {user.role === 'member' && ` - ${user.monthly_quota_hours}h/month`}
                    </span>
                  </div>
                  {user.role !== 'admin' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                      Edit
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {form.email}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="user-role">Role</FieldLabel>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((f) => ({ ...f, role: value, site_id: value === 'manager' ? f.site_id : '' }))}
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {form.role === 'manager' && (
                <Field>
                  <FieldLabel htmlFor="user-site">Site</FieldLabel>
                  <SitePicker
                    id="user-site"
                    sites={sites}
                    value={form.site_id}
                    onValueChange={(value) => setForm((f) => ({ ...f, site_id: value }))}
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="user-quota">Monthly quota (hours)</FieldLabel>
                <Input
                  id="user-quota"
                  type="number"
                  min="0"
                  step="1"
                  value={form.monthly_quota_hours}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_quota_hours: e.target.value }))}
                  required
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <DialogSubmitFooter submitting={submitting} label="Save changes" />
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
