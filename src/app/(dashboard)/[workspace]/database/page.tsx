import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DatabaseClient } from './database-client'
import { MOCK_WORKSPACE, MOCK_CONTACTS, isDevMode } from '@/lib/mock-data'
import type { Workspace, Contact } from '@/types/database'

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock data
  if (isDevMode()) {
    return (
      <DatabaseClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
        contacts={MOCK_CONTACTS}
      />
    )
  }

  // Production mode: use Supabase
  const supabase = await createClient()

  // Fetch workspace
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (workspaceError || !workspaceData) {
    notFound()
  }

  const workspace = workspaceData as Pick<Workspace, 'id' | 'name' | 'slug'>

  // Fetch contacts for this workspace
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError)
  }

  const contacts = (contactsData || []) as Contact[]

  return <DatabaseClient workspace={workspace} contacts={contacts} />
}
