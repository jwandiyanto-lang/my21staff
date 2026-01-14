import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InboxClient } from './inbox-client'
import { MOCK_WORKSPACE, MOCK_CONVERSATIONS, isDevMode } from '@/lib/mock-data'
import type { Workspace, ConversationWithContact } from '@/types/database'

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

  // Fetch workspace
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (workspaceError || !workspaceData) {
    notFound()
  }

  const workspace = workspaceData as Pick<Workspace, 'id' | 'name' | 'slug'>

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

  return <InboxClient workspace={workspace} conversations={conversations} />
}
