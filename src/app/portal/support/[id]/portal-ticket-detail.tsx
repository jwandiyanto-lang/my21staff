'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Send, Loader2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/portal/image-upload'
import {
  type TicketStage,
  STAGE_CONFIG,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  STAGES_ORDER,
  type TicketCategory,
  type TicketPriority,
} from '@/lib/tickets'

interface PortalTicketDetailProps {
  ticket: {
    id: string
    title: string
    description: string
    category: string
    priority: string
    stage: string
    created_at: string | null
    updated_at: string | null
    closed_at: string | null
  }
  comments: Array<{
    id: string
    content: string
    is_stage_change: boolean | null
    created_at: string | null
    author: { id: string; full_name: string | null } | null
  }>
  currentUserId: string
}

export function PortalTicketDetail({ ticket, comments }: PortalTicketDetailProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [attachments, setAttachments] = useState<Array<{ url: string; path: string }>>([])

  const currentStage = ticket.stage as TicketStage
  const isClosed = currentStage === 'closed'

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/portal/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      })

      if (response.ok) {
        toast.success('Comment added')
        setCommentText('')
        setAttachments([])
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (url: string, path: string) => {
    setAttachments((prev) => [...prev, { url, path }])
    // Add image markdown to comment
    setCommentText((prev) => prev + (prev ? '\n' : '') + `![Attachment](${url})`)
  }

  const handleImageRemove = (path: string) => {
    setAttachments((prev) => prev.filter((a) => a.path !== path))
  }

  return (
    <div>
      <Link
        href="/portal/support"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">
            {CATEGORY_CONFIG[ticket.category as TicketCategory].label}
          </Badge>
          <Badge variant={ticket.priority === 'high' ? 'destructive' : 'secondary'}>
            {PRIORITY_CONFIG[ticket.priority as TicketPriority].label}
          </Badge>
          <Badge variant={isClosed ? 'secondary' : 'default'}>
            {STAGE_CONFIG[currentStage].label}
          </Badge>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-6">
        <div className="flex items-center gap-1 flex-wrap">
          {STAGES_ORDER.map((stage, index) => {
            const isCurrent = stage === currentStage
            const isPast = STAGES_ORDER.indexOf(currentStage) > index
            const config = STAGE_CONFIG[stage]

            return (
              <div key={stage} className="flex items-center">
                <div
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isPast ? 'bg-primary/20 text-primary' : ''}
                    ${!isCurrent && !isPast ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {config.label}
                </div>
                {index < STAGES_ORDER.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">{ticket.description}</div>
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Created {ticket.created_at ? format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      {/* Discussion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet.
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.is_stage_change === true
                      ? 'bg-muted/50 border-l-2 border-primary'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium">
                      {comment.author?.full_name || 'Support Team'}
                    </span>
                    <span>
                      {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                    {comment.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
          {!isClosed ? (
            <div className="border-t pt-4">
              <Textarea
                placeholder="Write a reply..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="resize-none mb-3"
              />

              <ImageUpload
                ticketId={ticket.id}
                images={attachments}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                disabled={isSubmitting}
              />

              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !commentText.trim()}
                  size="sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground border-t">
              This ticket is closed. Contact support to reopen if needed.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
