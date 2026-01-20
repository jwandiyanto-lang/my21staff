import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DatabaseClient } from './database-client'
import { MOCK_WORKSPACE, isDevMode } from '@/lib/mock-data'

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock workspace
  if (isDevMode()) {
    return (
      <DatabaseClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
      />
    )
  }

  // Production: validate workspace exists
  const supabase = await createClient()
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (error || !workspace) {
    notFound()
  }

  return <DatabaseClient workspace={workspace} />
}
