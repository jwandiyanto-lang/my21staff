import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InboxClient } from './inbox-client'
import { MOCK_WORKSPACE, MOCK_CONVERSATIONS, isDevMode } from '@/lib/mock-data'
import type { Workspace, ConversationWithContact, WorkspaceMember, Profile } from '@/types/database'

export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface InboxPageProps {
  params: Promise<{ workspace: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock data
  if (isDevMode()) {
    return (
      <InboxClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
        conversations={MOCK_CONVERSATIONS}
        totalCount={MOCK_CONVERSATIONS.length}
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

  // Fetch conversations with contacts, ordered by last message (paginated)
  const { data: conversationsData, count: totalCount, error: conversationsError } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contacts(*)
    `, { count: 'exact' })
    .eq('workspace_id', workspace.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(0, 49) // First 50 conversations

  if (conversationsError) {
    console.error('Error fetching conversations:', conversationsError)
  }

  const conversations = (conversationsData || []) as unknown as ConversationWithContact[]

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch workspace members with profiles
  const { data: membersData } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('workspace_id', workspace.id)

  let teamMembers = (membersData || []) as unknown as TeamMember[]

  // Always include current user in team members list
  if (user) {
    const currentUserInList = teamMembers.some(m => m.user_id === user.id)
    if (!currentUserInList) {
      // Fetch current user's profile
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (currentUserProfile) {
        // Add current user as a team member
        teamMembers = [{
          id: `current-${user.id}`,
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
          created_at: new Date().toISOString(),
          profile: currentUserProfile,
        } as TeamMember, ...teamMembers]
      }
    }
  }

  // Extract quick replies and contact tags from settings
  const quickReplies = (workspace.settings?.quick_replies as Array<{id: string, label: string, text: string}>) || []
  const contactTags = (workspace.settings?.contact_tags as string[]) || ['Community', '1on1']

  return <InboxClient workspace={workspace} conversations={conversations} totalCount={totalCount ?? 0} quickReplies={quickReplies} teamMembers={teamMembers} contactTags={contactTags} />
}
