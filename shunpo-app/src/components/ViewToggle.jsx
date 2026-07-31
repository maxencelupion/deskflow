import { CalendarDays, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

function iconButtonClassName(active) {
  return cn(
    "rounded-full border p-2 transition-colors",
    active ? "border-home-ink bg-home-ink text-home-bg" : "border-home-border text-home-ink hover:bg-home-border"
  )
}

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('calendar')}
        className={iconButtonClassName(view === 'calendar')}
        aria-label="Calendar view"
        title="Calendar view"
      >
        <CalendarDays className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={iconButtonClassName(view === 'list')}
        aria-label="List view"
        title="List view"
      >
        <LayoutList className="size-4" />
      </button>
    </div>
  )
}
