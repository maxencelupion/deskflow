import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useSites() {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sites').select('id, name').order('name').then(({ data, error }) => {
      if (error) {
        console.error('Error loading sites:', error)
      } else {
        setSites(data)
      }

      setLoading(false)
    })
  }, [])

  return { sites, loading }
}
