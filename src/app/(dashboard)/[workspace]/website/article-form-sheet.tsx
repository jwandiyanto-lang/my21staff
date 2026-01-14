'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Article } from '@/types/database'
import { isDevMode } from '@/lib/mock-data'

interface ArticleFormSheetProps {
  article: Article | null
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (article: Article) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ArticleFormSheet({
  article,
  workspaceId,
  open,
  onOpenChange,
  onSaved,
}: ArticleFormSheetProps) {
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  // Track if slug was manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Initialize form when article changes
  useEffect(() => {
    if (article) {
      setTitle(article.title)
      setSlug(article.slug)
      setExcerpt(article.excerpt || '')
      setContent(article.content || '')
      setCoverImageUrl(article.cover_image_url || '')
      setStatus(article.status)
      setSlugManuallyEdited(true) // Don't auto-update slug for existing articles
    } else {
      // Reset form for new article
      setTitle('')
      setSlug('')
      setExcerpt('')
      setContent('')
      setCoverImageUrl('')
      setStatus('draft')
      setSlugManuallyEdited(false)
    }
  }, [article, open])

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title))
    }
  }, [title, slugManuallyEdited])

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugManuallyEdited(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!slug.trim()) {
      toast.error('Slug is required')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        status,
        workspace_id: workspaceId,
      }

      if (isDevMode()) {
        // Dev mode: simulate save
        const savedArticle: Article = {
          id: article?.id || `article-${Date.now()}`,
          ...articleData,
          published_at: status === 'published' ? (article?.published_at || now) : null,
          created_at: article?.created_at || now,
          updated_at: now,
        }

        toast.success(article ? 'Article updated (dev mode)' : 'Article created (dev mode)')

        onSaved(savedArticle)
        onOpenChange(false)
      } else {
        // Production: call API
        const url = article ? `/api/articles/${article.id}` : '/api/articles'
        const method = article ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save article')
        }

        const savedArticle = await response.json()

        toast.success(article ? 'Article updated successfully' : 'Article created successfully')

        onSaved(savedArticle)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Save article error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {article ? 'Edit Article' : 'Create Article'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="article-url-slug"
            />
            <p className="text-xs text-muted-foreground">
              URL: /articles/{'{workspace}'}/{slug || 'slug'}
            </p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Article content (supports basic markdown)"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports: # Heading, ## Subheading, paragraphs separated by blank lines
            </p>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published')}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {article ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
