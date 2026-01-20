import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeBaseClient } from './knowledge-base-client'

interface Props {
  params: Promise<{ workspace: string }>
}

export default async function KnowledgeBasePage({ params }: Props) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return notFound()
  }

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (error || !workspace) {
    return notFound()
  }

  // Get team members for consultant assignment dropdown
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .eq('workspace_id', workspace.id)

  const teamMembers = (members || []).map(m => ({
    id: m.user_id,
    email: (m.profiles as any)?.email || '',
    full_name: (m.profiles as any)?.full_name || '',
  })).filter(m => m.id)

  return (
    <KnowledgeBaseClient
      workspace={workspace}
      teamMembers={teamMembers}
    />
  )
}
