import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WebsiteClient } from './website-client'
import { MOCK_WORKSPACE, mockArticles, mockWebinars, isDevMode } from '@/lib/mock-data'
import type { Workspace, Article, Webinar } from '@/types/database'

interface WebsitePageProps {
  params: Promise<{ workspace: string }>
}

export default async function WebsitePage({ params }: WebsitePageProps) {
  const { workspace: workspaceSlug } = await params

  // Dev mode: use mock data
  if (isDevMode()) {
    return (
      <WebsiteClient
        workspace={{
          id: MOCK_WORKSPACE.id,
          name: MOCK_WORKSPACE.name,
          slug: MOCK_WORKSPACE.slug,
        }}
        articles={mockArticles}
        webinars={mockWebinars}
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

  // Fetch articles for this workspace
  // Note: Using type assertion until Supabase types are regenerated after migration
  const { data: articlesData, error: articlesError } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: Article[] | null; error: unknown }>
        }
      }
    }
  })
    .from('articles')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (articlesError) {
    console.error('Error fetching articles:', articlesError)
  }

  // Fetch webinars for this workspace
  // Note: Using type assertion until Supabase types are regenerated after migration
  const { data: webinarsData, error: webinarsError } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: Webinar[] | null; error: unknown }>
        }
      }
    }
  })
    .from('webinars')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('scheduled_at', { ascending: false })

  if (webinarsError) {
    console.error('Error fetching webinars:', webinarsError)
  }

  const articles = articlesData || []
  const webinars = webinarsData || []

  return <WebsiteClient workspace={workspace} articles={articles} webinars={webinars} />
}
