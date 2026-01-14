'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Video, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { articleStatuses, webinarStatuses, type ArticleStatus, type WebinarStatus } from '@/lib/content-status'
import { ArticleFormSheet } from './article-form-sheet'
import type { Workspace, Article, Webinar } from '@/types/database'

interface WebsiteClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  articles: Article[]
  webinars: Webinar[]
}

function StatusBadge({ status, type }: { status: string; type: 'article' | 'webinar' }) {
  const config = type === 'article'
    ? articleStatuses[status as ArticleStatus]
    : webinarStatuses[status as WebinarStatus]

  if (!config) return null

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const displayDate = article.published_at || article.created_at

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-2">
            {article.title}
          </CardTitle>
          <StatusBadge status={article.status} type="article" />
        </div>
      </CardHeader>
      <CardContent>
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(displayDate), 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function WebinarCard({ webinar }: { webinar: Webinar }) {
  const displayDate = webinar.scheduled_at

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-2">
            {webinar.title}
          </CardTitle>
          <StatusBadge status={webinar.status} type="webinar" />
        </div>
      </CardHeader>
      <CardContent>
        {webinar.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {webinar.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(displayDate), 'MMM d, yyyy h:mm a')}
          </span>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ type }: { type: 'articles' | 'webinars' }) {
  const Icon = type === 'articles' ? FileText : Video
  const label = type === 'articles' ? 'articles' : 'webinars'

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-1">No {label} yet</h3>
      <p className="text-sm text-muted-foreground">
        Create your first {type === 'articles' ? 'article' : 'webinar'} to get started.
      </p>
    </div>
  )
}

export function WebsiteClient({ workspace, articles: initialArticles, webinars }: WebsiteClientProps) {
  // Article state
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isArticleSheetOpen, setIsArticleSheetOpen] = useState(false)

  const handleCreateArticle = () => {
    setSelectedArticle(null)
    setIsArticleSheetOpen(true)
  }

  const handleEditArticle = (article: Article) => {
    setSelectedArticle(article)
    setIsArticleSheetOpen(true)
  }

  const handleArticleSaved = (savedArticle: Article) => {
    setArticles((prev) => {
      const exists = prev.find((a) => a.id === savedArticle.id)
      if (exists) {
        // Update existing
        return prev.map((a) => (a.id === savedArticle.id ? savedArticle : a))
      } else {
        // Add new
        return [savedArticle, ...prev]
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Website Manager</h1>
        <p className="text-muted-foreground">
          Manage your articles and webinars
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-1.5" />
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="webinars">
            <Video className="h-4 w-4 mr-1.5" />
            Webinars ({webinars.length})
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Articles</h2>
            <Button size="sm" onClick={handleCreateArticle}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Article
            </Button>
          </div>

          {articles.length === 0 ? (
            <EmptyState type="articles" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => handleEditArticle(article)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webinars Tab */}
        <TabsContent value="webinars" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Webinars</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Webinar
            </Button>
          </div>

          {webinars.length === 0 ? (
            <EmptyState type="webinars" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {webinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Article Form Sheet */}
      <ArticleFormSheet
        article={selectedArticle}
        workspaceId={workspace.id}
        open={isArticleSheetOpen}
        onOpenChange={setIsArticleSheetOpen}
        onSaved={handleArticleSaved}
      />
    </div>
  )
}
