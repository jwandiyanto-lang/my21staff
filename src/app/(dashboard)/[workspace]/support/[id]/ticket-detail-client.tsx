'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  AlertTriangle,
  User,
  Send,
  Building2,
  ImageIcon,
  MessageCircle,
} from 'lucide-react'
import { ImageUpload } from '@/components/portal/image-upload'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { hasPermission } from '@/lib/permissions/check'
import {
  type TicketStage,
  type TicketCategory,
  type TicketPriority,
  STAGE_CONFIG,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  STAGES_ORDER,
  getValidTargetStages,
} from '@/lib/tickets'

export interface TicketDetailData {
  id: string
  workspace_id: string
  admin_workspace_id: string | null
  requester_id: string
  assigned_to: string | null
  title: string
  description: string
  category: string
  priority: string
  stage: string
  pending_approval: boolean
  pending_stage: string | null
  approval_requested_at: string | null
  reopen_token: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  requester: { id: string; full_name: string | null; email: string } | null
  assignee: { id: string; full_name: string | null; email: string } | null
  source_workspace: { id: string; name: string; slug: string } | null
}

export interface CommentData {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_stage_change: boolean
  is_internal: boolean
  created_at: string
  author: { id: string; full_name: string | null; email: string } | null
}

export interface WorkspaceMemberData {
  user_id: string
  role: string
  full_name: string | null
  email: string | null
}

interface TicketDetailClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  ticket: TicketDetailData
  comments: CommentData[]
  currentUserRole: WorkspaceRole
  currentUserId: string
  workspaceMembers: WorkspaceMemberData[]
  isClientTicket: boolean
}

function getPriorityBadgeVariant(priority: TicketPriority): 'default' | 'secondary' | 'destructive' {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'secondary'
  }
}

function getStageBadgeVariant(stage: TicketStage): 'default' | 'secondary' | 'outline' {
  if (stage === 'closed') return 'secondary'
  if (stage === 'report') return 'outline'
  return 'default'
}

export function TicketDetailClient({
  workspace,
  ticket,
  comments,
  currentUserRole,
  currentUserId,
  workspaceMembers,
  isClientTicket,
}: TicketDetailClientProps) {
  const router = useRouter()
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ url: string; path: string }>>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [showReopenForm, setShowReopenForm] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [notifyParticipants, setNotifyParticipants] = useState(false)
  const [transitionComment, setTransitionComment] = useState('')
  const [selectedTargetStage, setSelectedTargetStage] = useState<TicketStage | ''>('')

  const currentStage = ticket.stage as TicketStage
  const isOwnerOrAdmin = hasPermission(currentUserRole, 'tickets:transition')
  const isAssignee = ticket.assigned_to === currentUserId
  const isRequester = ticket.requester_id === currentUserId
  const canTransition = isOwnerOrAdmin || isAssignee
  const canAssign = hasPermission(currentUserRole, 'tickets:assign')
  const validTargetStages = getValidTargetStages(currentStage, isOwnerOrAdmin)

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, is_internal: isInternalComment }),
      })

      if (response.ok) {
        toast.success(isInternalComment ? 'Internal note added' : 'Comment added successfully')
        setCommentText('')
        setIsInternalComment(false)
        setAttachments([])
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
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

  const handleAssign = async (userId: string | null) => {
    setIsAssigning(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId }),
      })

      if (response.ok) {
        toast.success(userId ? 'Ticket assigned successfully' : 'Assignment removed')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign ticket')
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      toast.error('Failed to assign ticket')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleTransition = async () => {
    if (!selectedTargetStage) return

    setIsTransitioning(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStage: selectedTargetStage,
          notifyParticipants,
          comment: transitionComment || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.pendingApproval) {
          toast.success('Skip request pending requester approval')
        } else {
          toast.success(`Ticket moved to ${STAGE_CONFIG[selectedTargetStage].label} stage`)
        }
        setSelectedTargetStage('')
        setTransitionComment('')
        setNotifyParticipants(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to transition ticket')
      }
    } catch (error) {
      console.error('Failed to transition ticket:', error)
      toast.error('Failed to transition ticket')
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })

      if (response.ok) {
        toast.success(approved ? 'Skip approved' : 'Skip rejected')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process approval')
      }
    } catch (error) {
      console.error('Failed to process approval:', error)
      toast.error('Failed to process approval')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening')
      return
    }

    setIsReopening(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reopenReason }),
      })

      if (response.ok) {
        toast.success('Ticket reopened successfully')
        setShowReopenForm(false)
        setReopenReason('')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reopen ticket')
      }
    } catch (error) {
      console.error('Failed to reopen ticket:', error)
      toast.error('Failed to reopen ticket')
    } finally {
      setIsReopening(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back link and header */}
      <div className="mb-6">
        <Link
          href={`/${workspace.slug}/support`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ticket List
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {CATEGORY_CONFIG[ticket.category as TicketCategory].label}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(ticket.priority as TicketPriority)}>
                {PRIORITY_CONFIG[ticket.priority as TicketPriority].label}
              </Badge>
              <Badge variant={getStageBadgeVariant(currentStage)}>
                {STAGE_CONFIG[currentStage].label}
              </Badge>
              {isClientTicket && ticket.source_workspace && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                  <Building2 className="h-3 w-3 mr-1" />
                  Client: {ticket.source_workspace.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignment dropdown (for owner/admin) */}
          {canAssign && (
            <div className="shrink-0">
              <Label className="text-xs text-muted-foreground mb-1 block">Assigned To</Label>
              <Select
                value={ticket.assigned_to || 'unassigned'}
                onValueChange={(v) => handleAssign(v === 'unassigned' ? null : v)}
                disabled={isAssigning}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {workspaceMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name || member.email || member.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Stage Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {STAGES_ORDER.map((stage, index) => {
            const isCurrent = stage === currentStage
            const isPast = STAGES_ORDER.indexOf(currentStage) > index
            const config = STAGE_CONFIG[stage]

            return (
              <div key={stage} className="flex items-center">
                <div
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-full
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

      {/* Approval Banner */}
      {ticket.pending_approval && isRequester && (
        <Alert className="mb-6 border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Your Approval Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            Admin has requested to skip stages and move directly to{' '}
            <span className="font-semibold">
              {ticket.pending_stage ? STAGE_CONFIG[ticket.pending_stage as TicketStage].label : ''}
            </span>
            . Do you approve?
          </AlertDescription>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => handleApproval(true)}
              disabled={isApproving}
            >
              {isApproving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(false)}
              disabled={isApproving}
            >
              Reject
            </Button>
          </div>
        </Alert>
      )}

      {/* Reopen Banner */}
      {currentStage === 'closed' && isRequester && (
        <Card className="mb-6 border-muted-foreground/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Ticket Closed</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This ticket has been resolved. If you have additional issues, you can reopen it.
                </p>

                {!showReopenForm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReopenForm(true)}
                  >
                    Reopen Ticket
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm mb-1.5 block">Reason for reopening *</Label>
                      <Textarea
                        placeholder="Please explain why you need to reopen this ticket..."
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleReopen}
                        disabled={isReopening || !reopenReason.trim()}
                      >
                        {isReopening && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowReopenForm(false)
                          setReopenReason('')
                        }}
                        disabled={isReopening}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{ticket.description}</div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>
                    Requester: {ticket.requester?.full_name || ticket.requester?.email || 'Unknown'}
                  </span>
                </div>
                <div>
                  Created: {format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discussion</CardTitle>
              <CardDescription>
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Start the discussion below.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-lg ${
                        comment.is_internal
                          ? 'bg-amber-50 border-l-2 border-amber-400'
                          : comment.is_stage_change
                            ? 'bg-muted/50 border-l-2 border-primary'
                            : 'bg-muted/30'
                      }`}
                    >
                      {comment.is_internal && (
                        <Badge variant="outline" className="mb-2 text-xs text-amber-600 border-amber-300">
                          Internal Note
                        </Badge>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="font-medium">
                          {comment.author?.full_name || comment.author?.email || 'Anonymous'}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Form */}
              <div className="border-t pt-4">
                <Textarea
                  placeholder={isInternalComment ? "Write an internal note (hidden from client)..." : "Write a comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className={`resize-none ${isInternalComment ? 'border-amber-300 bg-amber-50/50' : ''}`}
                />

                <div className="mt-3">
                  <ImageUpload
                    ticketId={ticket.id}
                    images={attachments}
                    onUpload={handleImageUpload}
                    onRemove={handleImageRemove}
                    disabled={isSubmittingComment}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  {/* Internal comment toggle - only show for owner/admin on client tickets */}
                  {(currentUserRole === 'owner' || currentUserRole === 'admin') && isClientTicket ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="internal"
                        checked={isInternalComment}
                        onCheckedChange={(checked) => setIsInternalComment(checked === true)}
                      />
                      <Label htmlFor="internal" className="text-sm font-normal cursor-pointer text-muted-foreground">
                        Internal note (hidden from client)
                      </Label>
                    </div>
                  ) : (
                    <div />
                  )}
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                    size="sm"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    {isInternalComment ? 'Add Note' : 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stage Transition */}
        <div className="space-y-6">
          {/* Stage Transition Card */}
          {canTransition && currentStage !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Stage</CardTitle>
                <CardDescription>
                  Move ticket to the next stage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-1 block">Target Stage</Label>
                  <Select
                    value={selectedTargetStage}
                    onValueChange={(v) => setSelectedTargetStage(v as TicketStage)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {validTargetStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {STAGE_CONFIG[stage].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-1 block">Note (optional)</Label>
                  <Textarea
                    placeholder="Reason for stage change..."
                    value={transitionComment}
                    onChange={(e) => setTransitionComment(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify"
                    checked={notifyParticipants}
                    onCheckedChange={(checked) => setNotifyParticipants(checked === true)}
                  />
                  <Label htmlFor="notify" className="text-sm font-normal cursor-pointer">
                    Notify participants via email
                  </Label>
                </div>

                <Button
                  onClick={handleTransition}
                  disabled={isTransitioning || !selectedTargetStage}
                  className="w-full"
                >
                  {isTransitioning && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Move to {selectedTargetStage ? STAGE_CONFIG[selectedTargetStage].label : '...'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Ticket Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket ID</span>
                <span className="font-mono text-xs">{ticket.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned To</span>
                <span>
                  {ticket.assignee?.full_name || ticket.assignee?.email || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester</span>
                <span>
                  {ticket.requester?.full_name || ticket.requester?.email || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closed</span>
                  <span>
                    {format(new Date(ticket.closed_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* WhatsApp Contact Button */}
              {isClientTicket && (
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                    onClick={() => {
                      const message = encodeURIComponent(
                        `Hi, regarding your support ticket "${ticket.title}" (ID: ${ticket.id.slice(0, 8)}):\n\n`
                      )
                      window.open(`https://wa.me/?text=${message}`, '_blank')
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact via WhatsApp
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    Opens WhatsApp with ticket context
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
