import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DatabaseClient } from './database-client'
import type { Workspace, Contact } from '@/types/database'

interface DatabasePageProps {
  params: Promise<{ workspace: string }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params
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
