import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const ALL_SITES = 'all_sites'

export function SitePicker({ id, sites, value, onValueChange, placeholder = 'Select a site', includeAllOption = false, className = 'w-full' }) {
  const internalValue = includeAllOption ? (value || ALL_SITES) : value

  function handleChange(newValue) {
    onValueChange(includeAllOption && newValue === ALL_SITES ? '' : newValue)
  }

  function resolveLabel(v) {
    if (includeAllOption && (v === ALL_SITES || !v)) {
      return 'All sites'
    }

    return sites.find((site) => site.id === v)?.name ?? placeholder
  }

  return (
    <Select value={internalValue} onValueChange={handleChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder}>{resolveLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value={ALL_SITES}>All sites</SelectItem>}
        {sites.map((site) => (
          <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
