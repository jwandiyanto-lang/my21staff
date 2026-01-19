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
} from 'lucide-react'
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
}

export interface CommentData {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_stage_change: boolean
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
}: TicketDetailClientProps) {
  const router = useRouter()
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
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
        body: JSON.stringify({ content: commentText }),
      })

      if (response.ok) {
        toast.success('Comment added successfully')
        setCommentText('')
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
        <Alert className="mb-6">
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>Tiket Selesai</AlertTitle>
          <AlertDescription>
            Tiket ini telah diselesaikan. Jika ada masalah tambahan, Anda dapat membuka kembali.
          </AlertDescription>

          {!showReopenForm ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setShowReopenForm(true)}
            >
              Buka Kembali Tiket
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-sm mb-1.5 block">Alasan membuka kembali tiket *</Label>
                <Textarea
                  placeholder="Jelaskan mengapa Anda perlu membuka kembali tiket ini..."
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
                  Konfirmasi
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
                  Batal
                </Button>
              </div>
            </div>
          )}
        </Alert>
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
                        comment.is_stage_change
                          ? 'bg-muted/50 border-l-2 border-primary'
                          : 'bg-muted/30'
                      }`}
                    >
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
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
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
                    Send
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
