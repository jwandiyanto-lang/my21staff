import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DatabaseClient } from './database-client'
import { MOCK_WORKSPACE, MOCK_CONTACTS, MOCK_TEAM_MEMBERS, isDevMode } from '@/lib/mock-data'
import type { Workspace, Contact, WorkspaceMember, Profile } from '@/types/database'

export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock data
  if (isDevMode()) {
    return (
      <DatabaseClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
        contacts={MOCK_CONTACTS}
        totalCount={MOCK_CONTACTS.length}
        contactTags={['Community', '1on1']}
        teamMembers={MOCK_TEAM_MEMBERS}
      />
    )
  }

  // Production mode: use Supabase
  const supabase = await createClient()

  // Fetch workspace with settings
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, slug, settings')
    .eq('slug', workspaceSlug)
    .single()

  if (workspaceError || !workspaceData) {
    notFound()
  }

  const workspace = workspaceData as Pick<Workspace, 'id' | 'name' | 'slug'> & { settings: Record<string, unknown> | null }

  // Fetch contacts for this workspace with pagination
  const { data: contactsData, count: totalCount, error: contactsError } = await supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .range(0, 24) // First 25 contacts

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError)
  }

  const contacts = (contactsData || []) as Contact[]

  // Fetch workspace members with profiles
  const { data: membersData } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('workspace_id', workspace.id)

  const teamMembers = (membersData || []) as unknown as TeamMember[]

  // Extract contact tags from settings
  const contactTags = (workspace.settings?.contact_tags as string[]) || ['Community', '1on1']

  return (
    <DatabaseClient
      workspace={workspace}
      contacts={contacts}
      totalCount={totalCount ?? 0}
      contactTags={contactTags}
      teamMembers={teamMembers}
    />
  )
}
