import { DashboardClient } from './dashboard-client'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params

  // In dev mode, use demo workspace
  const workspaceId = isDevMode ? ('demo' as any) : workspaceSlug

  return <DashboardClient workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
}
