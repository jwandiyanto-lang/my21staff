import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { InboxClient } from './inbox-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

interface InboxPageProps {
  params: Promise<{ workspace: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return <InboxClient workspaceId={MOCK_WORKSPACE.id as any} />
  }

  // Production: validate workspace exists via Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <InboxClient workspaceId={workspace._id} />
}
