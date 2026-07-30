import { USER_ROLE, USER_ROLE_LABELS } from '@/lib/enums'

const STYLES = {
  [USER_ROLE.ADMIN]: 'bg-violet-100 text-violet-700',
  [USER_ROLE.MANAGER]: 'bg-sky-100 text-sky-700',
  [USER_ROLE.MEMBER]: 'bg-emerald-100 text-emerald-700',
}

export function UserRoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[role] ?? 'bg-home-border text-home-ink'}`}
    >
      {USER_ROLE_LABELS[role] ?? role}
    </span>
  )
}
