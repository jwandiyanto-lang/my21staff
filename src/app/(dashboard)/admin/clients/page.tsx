import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from './clients-client'

export default async function AdminClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = !!membership || profile?.is_admin

  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Fetch all workspaces with contact counts
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select(`
      id,
      name,
      slug,
      owner_id,
      created_at,
      updated_at
    `)
    .order('name')

  // Get contact counts for each workspace
  const workspacesWithStats = await Promise.all(
    (workspaces || []).map(async (workspace) => {
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id)

      // Get workspace members
      const { data: members } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          must_change_password,
          created_at
        `)
        .eq('workspace_id', workspace.id)

      return {
        ...workspace,
        contact_count: contactCount || 0,
        members: members || [],
      }
    })
  )

  return <ClientsPageClient workspaces={workspacesWithStats} />
}
