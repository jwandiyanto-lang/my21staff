'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WorkspaceMember, Profile } from '@/types/database'
import { isDevMode, MOCK_TEAM_MEMBERS } from '@/lib/mock-data'

export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface WorkspaceSettingsResponse {
  teamMembers: TeamMember[]
  contactTags: string[]
}

export function useWorkspaceSettings(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-settings', workspaceId],
    queryFn: async (): Promise<WorkspaceSettingsResponse> => {
      if (isDevMode()) {
        return {
          teamMembers: MOCK_TEAM_MEMBERS,
          contactTags: ['Community', '1on1'],
        }
      }

      const supabase = createClient()

      // Fetch workspace settings
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single()

      // Fetch team members
      const { data: members } = await supabase
        .from('workspace_members')
        .select('*, profile:profiles(*)')
        .eq('workspace_id', workspaceId)

      // Get current user to ensure they're in list
      const { data: { user } } = await supabase.auth.getUser()

      let teamMembers = (members || []) as unknown as TeamMember[]

      if (user && !teamMembers.some(m => m.user_id === user.id)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          teamMembers = [{
            id: `current-${user.id}`,
            workspace_id: workspaceId,
            user_id: user.id,
            role: 'owner',
            created_at: new Date().toISOString(),
            profile,
          } as TeamMember, ...teamMembers]
        }
      }

      const contactTags = (workspace?.settings as Record<string, unknown>)?.contact_tags as string[] || ['Community', '1on1']

      return { teamMembers, contactTags }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - settings change rarely
  })
}
