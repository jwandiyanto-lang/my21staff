import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

// Direct fetch to Convex API (more reliable in server components)
async function getWorkspaceBySlug(slug: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL!
  const response = await fetch(`${url}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'workspaces:getBySlug',
      args: { slug },
    }),
    cache: 'no-store',
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.value
}

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
    const workspace = { id: MOCK_WORKSPACE.id, name: MOCK_WORKSPACE.name, slug: MOCK_WORKSPACE.slug }
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="noise-overlay" style={{ opacity: 0.03 }} />
        <WorkspaceSidebar workspace={workspace} isAdmin={true} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </div>
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

  // Production mode: use Clerk auth
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch workspace from Convex
  const workspace = await getWorkspaceBySlug(workspaceSlug)

  if (!workspace) {
    notFound()
  }

  // For now, everyone with access is treated as admin
  // TODO: Check organization membership role from Clerk
  const isAdmin = true

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="noise-overlay" style={{ opacity: 0.03 }} />
      <WorkspaceSidebar
        workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }}
        isAdmin={isAdmin}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>
        <footer className="h-10 px-8 bg-secondary border-t border-primary/10 flex items-center justify-between shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Network Stable
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
