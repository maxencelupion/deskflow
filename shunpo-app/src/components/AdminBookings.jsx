import { useState } from 'react'
import { SiteBookings } from '@/components/SiteBookings'
import { SitePicker } from '@/components/SitePicker'

export function AdminBookings({ pageSize = 5, sites }) {
  const [siteId, setSiteId] = useState('')

  const siteSelector = <SitePicker sites={sites} value={siteId} onValueChange={setSiteId} includeAllOption />

  return <SiteBookings siteId={siteId} pageSize={pageSize} siteSelector={siteSelector} />
}
