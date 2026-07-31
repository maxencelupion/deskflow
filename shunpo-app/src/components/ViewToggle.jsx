import { chipClassName } from '@/lib/utils'

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange('list')} className={chipClassName(view === 'list')}>
        List
      </button>
      <button type="button" onClick={() => onChange('calendar')} className={chipClassName(view === 'calendar')}>
        Calendar
      </button>
    </div>
  )
}
