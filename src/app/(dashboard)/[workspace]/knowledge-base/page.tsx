import { redirect } from 'next/navigation'

interface KnowledgeBasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function KnowledgeBasePage({ params }: KnowledgeBasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Redirect old knowledge-base route to dashboard
  // This maintains backwards compatibility for any existing bookmarks/links
  redirect(`/${workspaceSlug}`)
}
