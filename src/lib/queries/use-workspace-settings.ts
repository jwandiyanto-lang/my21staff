'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth, useUser } from '@clerk/nextjs'
import { MOCK_WORKSPACE, getMockWorkspaceSettings } from '@/lib/mock-data'

// Import the exact types expected by consumer components
import type { WorkspaceMember, Profile } from '@/types/database'

// Dev mode check
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Re-export the same shape consumers expect
export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface WorkspaceSettingsResponse {
  teamMembers: TeamMember[]
  contactTags: string[]
  mainFormFields: string[]
  fieldScores: Record<string, number>
}

// Mock data for dev mode
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-001',
    workspace_id: 'dev-workspace-001',
    user_id: 'dev-user-001',
    role: 'owner',
    must_change_password: false,
    settings: null,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'dev-user-001',
      email: 'jonathan@eagle.edu',
      full_name: 'Jonathan Wandiyanto',
      avatar_url: null,
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

export function useWorkspaceSettings(workspaceId: string | null) {
  // Call Clerk hooks unconditionally (required by React rules of hooks)
  const clerkAuth = useAuth()
  const clerkUser = useUser()
  const [mockSettingsVersion, setMockSettingsVersion] = useState(0)

  // Use Clerk data in production, mock data in dev mode
  const userId = isDevMode ? 'dev-user-001' : clerkAuth.userId
  const user = isDevMode ? { fullName: 'Dev User', primaryEmailAddress: { emailAddress: 'dev@localhost' }, imageUrl: null } : clerkUser.user

  // Listen for mock settings updates in dev mode
  useEffect(() => {
    if (!isDevMode) return

    const handleSettingsUpdate = () => {
      setMockSettingsVersion(v => v + 1)
    }

    window.addEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)
  }, [])

  // Dev mode: return mock data immediately, skip Convex queries
  const workspace = useQuery(
    api.workspaces.getById,
    isDevMode ? 'skip' : (workspaceId ? { id: workspaceId } : 'skip')
  )

  const members = useQuery(
    api.workspaceMembers.listByWorkspaceWithUsers,
    isDevMode ? 'skip' : (workspaceId ? { workspace_id: workspaceId } : 'skip')
  )

  // In dev mode, return mock data from MOCK_WORKSPACE
  // mockSettingsVersion is used to trigger re-renders when settings change
  if (isDevMode) {
    const mockSettings = getMockWorkspaceSettings()
    return {
      data: {
        teamMembers: MOCK_TEAM_MEMBERS,
        contactTags: mockSettings.contact_tags || [],
        mainFormFields: mockSettings.main_form_fields || [],
        fieldScores: mockSettings.form_field_scores || {},
      },
      isLoading: false,
    }
  }

  const isLoading = workspace === undefined || members === undefined

  if (isLoading || !workspace || !members) {
    return {
      data: undefined,
      isLoading,
    }
  }

  // Extract contact tags, main form fields, and field scores from workspace settings
  const workspaceSettings = (workspace as { settings?: Record<string, unknown> }).settings
  const contactTags = workspaceSettings?.contact_tags as string[] || []
  const mainFormFields = workspaceSettings?.main_form_fields as string[] || MOCK_MAIN_FORM_FIELDS
  const fieldScores = workspaceSettings?.form_field_scores as Record<string, number> || MOCK_FIELD_SCORES

  // Map Convex members to expected TeamMember structure
  const teamMembers: TeamMember[] = members.map((m: Record<string, unknown>) => {
    const userObj = m.user as Record<string, unknown> | null
    return {
      id: m._id as string,
      user_id: m.user_id as string,
      workspace_id: m.workspace_id as string,
      role: m.role as string,
      must_change_password: false,
      settings: null,
      created_at: new Date(m.created_at as number).toISOString(),
      profile: userObj ? {
        id: m.user_id as string,
        full_name: userObj.name as string || null,
        email: userObj.email as string || null,
        avatar_url: null,
        created_at: null,
        is_admin: null,
        updated_at: null,
      } : null,
    }
  })

  // Ensure current user is in the team members list
  if (userId && !teamMembers.some(m => m.user_id === userId)) {
    teamMembers.unshift({
      id: `temp-${userId}`,
      user_id: userId,
      workspace_id: workspaceId || '',
      role: 'owner',
      must_change_password: false,
      settings: null,
      created_at: new Date().toISOString(),
      profile: user ? {
        id: userId,
        full_name: user.fullName || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        avatar_url: user.imageUrl || null,
        created_at: null,
        is_admin: null,
        updated_at: null,
      } : null,
    })
  }

  return {
    data: {
      teamMembers,
      contactTags,
      mainFormFields,
      fieldScores,
    },
    isLoading: false,
  }
}
