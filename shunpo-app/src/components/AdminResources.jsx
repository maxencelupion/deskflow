import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ManageResources } from '@/components/ManageResources'
import { SitePicker } from '@/components/SitePicker'

export function AdminResources({ pageSize = 5, sites, sitesLoading }) {
  const [siteId, setSiteId] = useState('')
  const resolvedSiteId = siteId || sites[0]?.id || ''

  if (!sitesLoading && sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Create a site first.</p>
        </CardContent>
      </Card>
    )
  }

  const siteSelector = <SitePicker sites={sites} value={resolvedSiteId} onValueChange={setSiteId} />

  return <ManageResources siteId={resolvedSiteId} pageSize={pageSize} siteSelector={siteSelector} />
}
