import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

export function DialogSubmitFooter({ submitting, disabled = false, label, pendingLabel = '...' }) {
  return (
    <DialogFooter>
      <Button type="submit" disabled={submitting || disabled}>
        {submitting ? pendingLabel : label}
      </Button>
    </DialogFooter>
  )
}
