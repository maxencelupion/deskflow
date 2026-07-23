import { useEffect, useState } from 'react'

export function usePaginatedQuery(fetchPage, deps, pageSize) {
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  const depsKey = deps.join('|')

  // Reset to page 0 whenever pageSize or a dep changes
  const resetKey = `${pageSize}|${depsKey}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setPage(0)
  }

  const fetchKey = `${page}|${resetKey}|${reloadKey}`

  const [loadedKey, setLoadedKey] = useState(null)
  const loading = loadedKey !== fetchKey

  useEffect(() => {
    let cancelled = false

    Promise.resolve(fetchPage(page, pageSize)).then((result) => {
      if (cancelled) {
        return
      }

      setTotalCount(result?.count ?? 0)
      setLoadedKey(fetchKey)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey])

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  function refetch() {
    setReloadKey((k) => k + 1)
  }

  return { page, setPage, totalPages, loading, refetch }
}
