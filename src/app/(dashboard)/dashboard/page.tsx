import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'

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
    .maybeSingle()

  // Also check profiles.is_admin flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

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
    .maybeSingle()

  if (membership) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('slug')
      .eq('id', membership.workspace_id)
      .maybeSingle()

    if (workspace) {
      redirect(`/${workspace.slug}`)
    }
  }

  // No membership found - check for pending invitations and auto-accept
  // This handles the case where a user reset their password via forgot-password
  // instead of the invitation set-password flow
  if (user.email) {
    const adminClient = createApiAdminClient()
    const { data: pendingInvitation } = await adminClient
      .from('workspace_invitations')
      .select('id, workspace_id')
      .eq('email', user.email.toLowerCase())
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (pendingInvitation) {
      // Auto-accept the pending invitation
      // Add user to workspace
      const { error: memberError } = await adminClient
        .from('workspace_members')
        .insert({
          workspace_id: pendingInvitation.workspace_id,
          user_id: user.id,
          role: 'member',
        })

      if (!memberError) {
        // Update invitation status
        await adminClient
          .from('workspace_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingInvitation.id)

        // Get workspace slug and redirect
        const { data: workspace } = await adminClient
          .from('workspaces')
          .select('slug')
          .eq('id', pendingInvitation.workspace_id)
          .maybeSingle()

        if (workspace) {
          redirect(`/${workspace.slug}`)
        }
      }
    }
  }

  // Fallback: no workspace found and no pending invitation
  // Redirect to portal instead of login to avoid loop
  redirect('/portal')
}
