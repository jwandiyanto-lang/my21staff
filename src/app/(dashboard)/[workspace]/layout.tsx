import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'
import { shouldUseMockData, MOCK_CONVEX_WORKSPACE, isDevMode } from '@/lib/mock-data'
import type { Id } from '@/../convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

async function getWorkspaceBySlug(slug: string) {
  try {
    return await convex.query(api.workspaces.getBySlug, { slug })
  } catch {
    return null
  }
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

  // Dev mode + demo: fully offline mock data (no Convex calls)
  if (shouldUseMockData(workspaceSlug)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="noise-overlay" style={{ opacity: 0.03 }} />
        <WorkspaceSidebar
          workspace={{
            id: MOCK_CONVEX_WORKSPACE._id as Id<'workspaces'>,
            name: MOCK_CONVEX_WORKSPACE.name,
            slug: MOCK_CONVEX_WORKSPACE.slug,
          }}
          isAdmin={true}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </div>
          <footer className="h-10 px-8 bg-white/80 border-t border-black/5 flex items-center justify-between shrink-0">
            <div />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Offline Mode
              </span>
            </div>
          </footer>
        </main>
      </div>
    )
  }

  // Dev mode (non-demo slugs): skip auth, use real Convex data
  if (isDevMode()) {
    const workspace = await getWorkspaceBySlug(workspaceSlug)

    if (!workspace) {
      notFound()
    }

    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="noise-overlay" style={{ opacity: 0.03 }} />
        <WorkspaceSidebar
          workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }}
          isAdmin={true}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </div>
          <footer className="h-10 px-8 bg-white/80 border-t border-black/5 flex items-center justify-between shrink-0">
            <div />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Dev Mode
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
        <footer className="h-10 px-8 bg-white/80 border-t border-black/5 flex items-center justify-between shrink-0">
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
