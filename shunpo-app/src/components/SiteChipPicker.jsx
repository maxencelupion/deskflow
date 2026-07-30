import { chipClassName } from '@/lib/utils'

export function SiteChipPicker({ sites, value, onChange, includeAllOption = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {includeAllOption && (
        <button type="button" onClick={() => onChange('')} className={chipClassName(!value)}>
          All sites
        </button>
      )}
      {sites.map((site) => (
        <button
          key={site.id}
          type="button"
          onClick={() => onChange(site.id)}
          className={chipClassName(value === site.id)}
        >
          {site.name}
        </button>
      ))}
    </div>
  )
}
