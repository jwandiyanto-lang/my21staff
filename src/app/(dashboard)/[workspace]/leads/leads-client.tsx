'use client'

import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { LeadTable } from '@/components/leads/lead-table'
import { columns } from '@/components/leads/lead-columns'
import { Badge } from '@/components/ui/badge'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock leads will be added in Task 3
const MOCK_LEADS: any[] = []

interface LeadsContentProps {
  workspaceId: Id<'workspaces'>
}

export function LeadsContent({ workspaceId }: LeadsContentProps) {
  // Query leads from Convex
  const leads = useQuery(
    api.leads.getLeadsByStatus,
    isDevMode ? 'skip' : { workspaceId, limit: 100 }
  )

  // Use mock data in dev mode, otherwise use Convex data
  const data = isDevMode ? MOCK_LEADS : (leads ?? [])
  const isLoading = !isDevMode && leads === undefined

  if (isLoading) {
    return (
      <div className="h-full p-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Leads</h1>
          <Badge variant="secondary" className="font-mono">
            {data.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage and track all your WhatsApp leads
        </p>
      </div>

      {/* Filter bar - placeholder for Plan 02 */}
      <div className="px-8 py-4 border-b border-border bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Filters coming in next plan...
        </div>
      </div>

      {/* Lead Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <LeadTable data={data} columns={columns} />
      </div>
    </div>
  )
}
