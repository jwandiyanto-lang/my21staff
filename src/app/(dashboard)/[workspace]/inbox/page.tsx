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

  // Fetch conversations with contacts, ordered by last message
  const { data: conversationsData, error: conversationsError } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('workspace_id', workspace.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (conversationsError) {
    console.error('Error fetching conversations:', conversationsError)
  }

  const conversations = (conversationsData || []) as unknown as ConversationWithContact[]

  // Fetch workspace members with profiles
  const { data: membersData } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('workspace_id', workspace.id)

  const teamMembers = (membersData || []) as unknown as TeamMember[]

  // Extract quick replies from settings
  const quickReplies = (workspace.settings?.quick_replies as Array<{id: string, label: string, text: string}>) || []

  return <InboxClient workspace={workspace} conversations={conversations} quickReplies={quickReplies} teamMembers={teamMembers} />
}
