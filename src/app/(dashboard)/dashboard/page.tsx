import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin (owner or admin role in any workspace)
  const { data: adminMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single()

  // Also check profiles.is_admin flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = !!adminMembership || profile?.is_admin

  if (isAdmin) {
    // Admin users go to admin dashboard or first workspace
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('slug')
      .order('name')
      .limit(1)

    if (workspaces && workspaces.length > 0) {
      redirect(`/${workspaces[0].slug}`)
    }
    // If no workspaces exist, redirect to admin clients page
    redirect('/admin/clients')
  }

  // Non-admin users: redirect to their workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('slug')
      .eq('id', membership.workspace_id)
      .single()

    if (workspace) {
      redirect(`/${workspace.slug}`)
    }
  }

  // Fallback: no workspace found
  redirect('/login')
}
