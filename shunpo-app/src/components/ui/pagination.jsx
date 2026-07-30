import { Button } from '@/components/ui/button'

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="grid grid-cols-3 items-center pt-1">
      <Button
        variant="outline"
        size="sm"
        hidden={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="col-start-1 justify-self-start rounded-full border-home-border bg-transparent text-home-ink hover:bg-home-border dark:bg-transparent"
      >
        Previous
      </Button>
      <span className="col-start-2 justify-self-center text-xs text-home-muted">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        hidden={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="col-start-3 justify-self-end rounded-full border-home-border bg-transparent text-home-ink hover:bg-home-border dark:bg-transparent"
      >
        Next
      </Button>
    </div>
  )
}
