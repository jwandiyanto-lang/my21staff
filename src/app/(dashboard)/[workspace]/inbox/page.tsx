import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InboxClient } from './inbox-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

interface InboxPageProps {
  params: Promise<{ workspace: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return (
      <InboxClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
        currentUserId="mock-user-id"
      />
    )
  }

  // Production: validate workspace exists and user is authenticated
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (error || !workspace) {
    notFound()
  }

  return <InboxClient workspace={workspace} currentUserId={user.id} />
}
