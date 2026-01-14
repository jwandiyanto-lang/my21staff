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
import type { Webinar } from '@/types/database'
import { isDevMode } from '@/lib/mock-data'

interface WebinarFormSheetProps {
  webinar: Webinar | null
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (webinar: Webinar) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function WebinarFormSheet({
  webinar,
  workspaceId,
  open,
  onOpenChange,
  onSaved,
}: WebinarFormSheetProps) {
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [maxRegistrations, setMaxRegistrations] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'published' | 'completed' | 'cancelled'>('draft')

  // Track if slug was manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Initialize form when webinar changes
  useEffect(() => {
    if (webinar) {
      setTitle(webinar.title)
      setSlug(webinar.slug)
      setDescription(webinar.description || '')
      setCoverImageUrl(webinar.cover_image_url || '')
      setScheduledAt(toDatetimeLocal(webinar.scheduled_at))
      setDuration(webinar.duration_minutes)
      setMeetingUrl(webinar.meeting_url || '')
      setMaxRegistrations(webinar.max_registrations?.toString() || '')
      setStatus(webinar.status)
      setSlugManuallyEdited(true) // Don't auto-update slug for existing webinars
    } else {
      // Reset form for new webinar
      setTitle('')
      setSlug('')
      setDescription('')
      setCoverImageUrl('')
      setScheduledAt('')
      setDuration(60)
      setMeetingUrl('')
      setMaxRegistrations('')
      setStatus('draft')
      setSlugManuallyEdited(false)
    }
  }, [webinar, open])

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

    if (!scheduledAt) {
      toast.error('Scheduled date is required')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const webinarData = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: duration,
        meeting_url: meetingUrl.trim() || null,
        max_registrations: maxRegistrations ? parseInt(maxRegistrations, 10) : null,
        status,
        workspace_id: workspaceId,
      }

      if (isDevMode()) {
        // Dev mode: simulate save
        const savedWebinar: Webinar = {
          id: webinar?.id || `webinar-${Date.now()}`,
          ...webinarData,
          published_at: status === 'published' ? (webinar?.published_at || now) : null,
          created_at: webinar?.created_at || now,
          updated_at: now,
        }

        toast.success(webinar ? 'Webinar updated (dev mode)' : 'Webinar created (dev mode)')

        onSaved(savedWebinar)
        onOpenChange(false)
      } else {
        // Production: call API
        const url = webinar ? `/api/webinars/${webinar.id}` : '/api/webinars'
        const method = webinar ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webinarData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save webinar')
        }

        const savedWebinar = await response.json()

        toast.success(webinar ? 'Webinar updated successfully' : 'Webinar created successfully')

        onSaved(savedWebinar)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Save webinar error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save webinar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {webinar ? 'Edit Webinar' : 'Create Webinar'}
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
              placeholder="Enter webinar title"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="webinar-url-slug"
            />
            <p className="text-xs text-muted-foreground">
              URL: /webinars/{'{workspace}'}/{slug || 'slug'}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the webinar"
              rows={3}
            />
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

          {/* Scheduled At */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
              min={15}
              max={480}
            />
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting URL</Label>
            <Input
              id="meetingUrl"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
            <p className="text-xs text-muted-foreground">
              Zoom, Google Meet, or other meeting link
            </p>
          </div>

          {/* Max Registrations */}
          <div className="space-y-2">
            <Label htmlFor="maxRegistrations">Max Registrations</Label>
            <Input
              id="maxRegistrations"
              type="number"
              value={maxRegistrations}
              onChange={(e) => setMaxRegistrations(e.target.value)}
              placeholder="Leave blank for unlimited"
              min={1}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
              {webinar ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
