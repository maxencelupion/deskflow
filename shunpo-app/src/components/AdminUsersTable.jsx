import { useState } from 'react'
import { SquarePen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { useSites } from '@/hooks/useSites'
import { USER_ROLE, USER_ROLE_LABELS, BOOKING_STATUS } from '@/lib/enums'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { SitePicker } from '@/components/SitePicker'
import { CountBadge } from '@/components/CountBadge'
import { UserRoleBadge } from '@/components/UserRoleBadge'
import { Spinner } from '@/components/Spinner'

const ASSIGNABLE_ROLES = [USER_ROLE.MEMBER, USER_ROLE.MANAGER]

const INPUT_CLASSNAME = "border-home-border bg-home-card text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"

const emptyForm = { id: null, email: '', role: USER_ROLE.MEMBER, site_id: '', monthly_quota_hours: '10' }

export function AdminUsersTable({ pageSize = 5 }) {
  const [users, setUsers] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
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

      const userIds = data.map((user) => user.id)

      if (userIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('user_id')
          .in('user_id', userIds)
          .eq('status', BOOKING_STATUS.CONFIRMED)
          .gte('start_at', new Date().toISOString())

        if (bookingsError) {
          console.error('Error loading booking counts:', bookingsError)
        } else {
          const counts = {}
          for (const booking of bookingsData) {
            counts[booking.user_id] = (counts[booking.user_id] ?? 0) + 1
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

    if (form.role === USER_ROLE.MANAGER && !form.site_id) {
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
    <div>
      <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-home-muted">Users</h2>

      <div className="overflow-hidden rounded-2xl border border-home-border bg-home-card shadow-[0_4px_16px_-6px_rgba(17,17,17,0.12)]">
        {loading ? (
          <div className="flex justify-center px-5 py-6"><Spinner /></div>
        ) : users.length === 0 ? (
          <p className="px-5 py-4 text-sm text-home-muted-2">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-home-border text-left text-xs font-semibold tracking-wide text-home-muted uppercase">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Site</th>
                  <th className="px-5 py-3">Quota</th>
                  <th className="px-5 py-3">Upcoming bookings</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-home-border odd:bg-home-card even:bg-home-bg/50 last:border-0 hover:bg-home-border/40! transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{user.email}</td>
                    <td className="px-5 py-3"><UserRoleBadge role={user.role} /></td>
                    <td className="px-5 py-3 text-home-muted">
                      {user.role === USER_ROLE.MANAGER ? (user.sites?.name ?? '—') : '—'}
                    </td>
                    <td className="px-5 py-3 text-home-muted">
                      {user.role === USER_ROLE.MEMBER ? `${user.monthly_quota_hours}h/month` : '—'}
                    </td>
                    <td className="px-5 py-3"><CountBadge count={bookingCounts[user.id]} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        {user.role !== USER_ROLE.ADMIN && (
                          <button
                            type="button"
                            aria-label="Edit"
                            onClick={() => openEditDialog(user)}
                            className="rounded-full border border-home-border p-1.5 text-home-ink transition-colors hover:bg-home-border"
                          >
                            <SquarePen className="size-4" />
                          </button>
                        )}
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
        <DialogContent className="rounded-2xl border-none bg-home-bg text-home-ink ring-home-border">
          <DialogHeader>
            <DialogTitle className="text-home-ink">Edit {form.email}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-home-ink">Role</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {ASSIGNABLE_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role, site_id: role === USER_ROLE.MANAGER ? f.site_id : '' }))}
                      aria-pressed={form.role === role}
                      className={
                        form.role === role
                          ? "rounded-full border border-home-ink bg-home-ink px-4 py-2 text-sm font-medium text-home-bg transition-colors"
                          : "rounded-full border border-home-border bg-home-card px-4 py-2 text-sm font-medium text-home-ink transition-colors hover:bg-home-border"
                      }
                    >
                      {USER_ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </Field>

              {form.role === USER_ROLE.MANAGER && (
                <Field>
                  <FieldLabel htmlFor="user-site" className="text-home-ink">Site</FieldLabel>
                  <SitePicker
                    id="user-site"
                    sites={sites}
                    value={form.site_id}
                    onValueChange={(value) => setForm((f) => ({ ...f, site_id: value }))}
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="user-quota" className="text-home-ink">Monthly quota (hours)</FieldLabel>
                <Input
                  id="user-quota"
                  type="number"
                  min="0"
                  step="1"
                  value={form.monthly_quota_hours}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_quota_hours: e.target.value }))}
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
                  {submitting ? '...' : 'Save changes'}
                </button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
