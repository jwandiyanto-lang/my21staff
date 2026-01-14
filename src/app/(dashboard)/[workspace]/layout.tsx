import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'
import type { Workspace } from '@/types/database'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspace: string }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: skip auth and use mock workspace
  if (isDevMode()) {
    const workspace = { name: MOCK_WORKSPACE.name, slug: MOCK_WORKSPACE.slug }
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Noise Overlay */}
        <div className="noise-overlay" style={{ opacity: 0.03 }} />

        {/* Sidebar */}
        <WorkspaceSidebar workspace={workspace} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </div>

          {/* Footer */}
          <footer className="h-10 px-8 bg-sidebar/40 border-t border-black/5 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              © 2024 MY21STAFF INC.
            </p>
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

  // Production mode: use Supabase
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (error || !data) {
    notFound()
  }

  const workspace = data as Pick<Workspace, 'id' | 'name' | 'slug'>

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Noise Overlay */}
      <div className="noise-overlay" style={{ opacity: 0.03 }} />

      {/* Sidebar */}
      <WorkspaceSidebar workspace={{ name: workspace.name, slug: workspace.slug }} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <footer className="h-10 px-8 bg-sidebar/40 border-t border-black/5 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            © 2024 MY21STAFF INC.
          </p>
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
