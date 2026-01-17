import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
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

  // Get user's first workspace for sidebar context
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('name, slug')
    .order('name')
    .limit(1)

  const defaultWorkspace = workspaces?.[0] || { name: 'Admin', slug: 'admin' }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Noise Overlay */}
      <div className="noise-overlay" style={{ opacity: 0.03 }} />

      {/* Sidebar */}
      <WorkspaceSidebar workspace={defaultWorkspace} isAdmin={true} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <footer className="h-10 px-8 bg-sidebar/40 border-t border-black/5 flex items-center justify-between shrink-0">
<div />
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Network Stable
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
