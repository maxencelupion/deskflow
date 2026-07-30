import { RESOURCE_TYPE } from '@/lib/enums'

const STYLES = {
  [RESOURCE_TYPE.ROOM]: 'bg-sky-100 text-sky-700',
  [RESOURCE_TYPE.OFFICE]: 'bg-amber-100 text-amber-700',
}

export function ResourceTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[type] ?? 'bg-home-border text-home-ink'}`}
    >
      {type}
    </span>
  )
}
