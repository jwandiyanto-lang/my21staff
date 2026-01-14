import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { mockArticles, isDevMode, MOCK_WORKSPACE } from '@/lib/mock-data'
import type { Article, Workspace } from '@/types/database'

interface ArticlePageProps {
  params: Promise<{ workspace: string; slug: string }>
}

// Simple markdown renderer
function renderMarkdown(content: string): string {
  return content
    // Escape HTML to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers: ## -> h2, # -> h1
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Line breaks and paragraphs
    .split('\n\n')
    .map(para => {
      // Skip if already a heading tag
      if (para.startsWith('<h1') || para.startsWith('<h2') || para.startsWith('<h3')) {
        return para
      }
      return `<p class="mb-4 leading-relaxed">${para.replace(/\n/g, '<br />')}</p>`
    })
    .join('')
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { workspace: workspaceSlug, slug } = await params

  let article: Article | null = null
  let workspaceName: string = ''

  if (isDevMode()) {
    // Dev mode: lookup from mockArticles
    if (workspaceSlug === MOCK_WORKSPACE.slug || workspaceSlug === 'demo') {
      article = mockArticles.find(
        (a) => a.slug === slug && a.status === 'published'
      ) || null
      workspaceName = MOCK_WORKSPACE.name
    }
  } else {
    // Production: fetch from Supabase
    const supabase = await createClient()

    // First get the workspace by slug
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('slug', workspaceSlug)
      .single()

    if (wsError || !workspaceData) {
      notFound()
    }

    const workspace = workspaceData as Pick<Workspace, 'id' | 'name'>
    workspaceName = workspace.name

    // Then fetch the article by workspace_id and slug
    // Using type assertion until Supabase types are regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as unknown as any
    const { data: articleData, error: articleError } = await client
      .from('articles')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (articleError || !articleData) {
      notFound()
    }

    article = articleData as Article
  }

  // If no article found or not published, return 404
  if (!article || article.status !== 'published') {
    notFound()
  }

  const publishedDate = article.published_at
    ? format(new Date(article.published_at), 'MMMM d, yyyy')
    : null

  return (
    <main className="min-h-screen bg-white">
      <article className="max-w-2xl mx-auto px-4 py-12">
        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="mb-8 -mx-4 sm:-mx-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-64 sm:h-80 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {publishedDate && <time>{publishedDate}</time>}
            <span className="text-gray-300">|</span>
            <span>{workspaceName}</span>
          </div>
        </header>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg text-gray-600 mb-8 leading-relaxed border-l-4 border-gray-200 pl-4 italic">
            {article.excerpt}
          </p>
        )}

        {/* Content */}
        {article.content && (
          <div
            className="prose prose-gray max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Published by {workspaceName}
          </p>
        </footer>
      </article>
    </main>
  )
}
