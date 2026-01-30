import { redirect } from 'next/navigation'

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params

  // Phase 2.5: Redirect to Your Team as the main page
  // Dashboard will be built in Phase 6
  redirect(`/${workspaceSlug}/your-team`)
}
