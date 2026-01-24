'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@clerk/nextjs'

export interface TeamMember {
  user_id: string
  role: string
  created_at: number
}

interface WorkspaceSettingsResponse {
  teamMembers: TeamMember[]
  contactTags: string[]
}

export function useWorkspaceSettings(workspaceId: string | null) {
  const { userId } = useAuth()

  // Fetch workspace data
  const workspace = useQuery(
    api.workspaces.getById,
    workspaceId ? { id: workspaceId } : 'skip'
  )

  // Fetch team members
  const members = useQuery(
    api.workspaceMembers.listByWorkspace,
    workspaceId ? { workspace_id: workspaceId } : 'skip'
  )

  const isLoading = workspace === undefined || members === undefined

  if (isLoading || !workspace || !members) {
    return {
      settings: undefined,
      isLoading,
    }
  }

  // Extract contact tags from workspace settings
  const contactTags = (workspace.settings as Record<string, unknown>)?.contact_tags as string[] || ['Community', '1on1']

  // Ensure current user is in the team members list
  let teamMembers = members as TeamMember[]
  if (userId && !teamMembers.some(m => m.user_id === userId)) {
    teamMembers = [{
      user_id: userId,
      role: 'owner',
      created_at: Date.now(),
    }, ...teamMembers]
  }

  const settings: WorkspaceSettingsResponse = {
    teamMembers,
    contactTags,
  }

  return {
    settings,
    isLoading: false,
  }
}
