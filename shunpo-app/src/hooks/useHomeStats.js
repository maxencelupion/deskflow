import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useHomeStats() {
  const [stats, setStats] = useState({ sites: null, rooms: null, offices: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_home_stats')

      if (error) {
        console.error('Error loading home stats:', error)
      }

      if (!cancelled) {
        const row = data?.[0]
        setStats({
          sites: row?.sites_count != null ? Number(row.sites_count) : null,
          rooms: row?.rooms_count != null ? Number(row.rooms_count) : null,
          offices: row?.offices_count != null ? Number(row.offices_count) : null,
        })
        setLoading(false)
      }
    }

    fetchStats()

    return () => {
      cancelled = true
    }
  }, [])

  return { ...stats, loading }
}
