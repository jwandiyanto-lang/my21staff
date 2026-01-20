'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  GitBranch,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FlowTabProps {
  workspaceId: string
}

interface FlowStage {
  id: string
  workspace_id: string
  name: string
  goal: string
  sample_script: string | null
  exit_criteria: string | null
  stage_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StageFormData {
  name: string
  goal: string
  sample_script: string
  exit_criteria: string
}

const emptyFormData: StageFormData = {
  name: '',
  goal: '',
  sample_script: '',
  exit_criteria: '',
}

export function FlowTab({ workspaceId }: FlowTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [stages, setStages] = useState<FlowStage[]>([])
  const [isDefault, setIsDefault] = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStageData, setNewStageData] = useState<StageFormData>(emptyFormData)
  const [isCreating, setIsCreating] = useState(false)

  // Edit state
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<StageFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reorder state
  const [isReordering, setIsReordering] = useState(false)

  async function fetchStages() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/flow-stages`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStages(data.stages)
      setIsDefault(data.isDefault)
    } catch (error) {
      console.error('Failed to fetch stages:', error)
      toast.error('Failed to load conversation flow')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stages on mount
  useEffect(() => {
    fetchStages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function handleCreateStage() {
    if (!newStageData.name.trim()) {
      toast.error('Stage name is required')
      return
    }
    if (!newStageData.goal.trim()) {
      toast.error('Stage goal is required')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/flow-stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageData.name.trim(),
          goal: newStageData.goal.trim(),
          sample_script: newStageData.sample_script.trim() || null,
          exit_criteria: newStageData.exit_criteria.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create stage')
      }

      await fetchStages()
      setIsAddDialogOpen(false)
      setNewStageData(emptyFormData)
      toast.success('Stage created')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create stage'
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSaveEdit(stageId: string) {
    if (!editFormData.name.trim()) {
      toast.error('Stage name is required')
      return
    }
    if (!editFormData.goal.trim()) {
      toast.error('Stage goal is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/flow-stages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stageId,
          name: editFormData.name.trim(),
          goal: editFormData.goal.trim(),
          sample_script: editFormData.sample_script.trim() || null,
          exit_criteria: editFormData.exit_criteria.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update stage')
      }

      await fetchStages()
      setEditingStage(null)
      toast.success('Stage updated')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update stage'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteStageId) return

    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/flow-stages?id=${deleteStageId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete stage')
      }

      await fetchStages()
      setDeleteStageId(null)
      toast.success('Stage deleted')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete stage'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleReorder(stageId: string, direction: 'up' | 'down') {
    const currentIndex = stages.findIndex(s => s.id === stageId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= stages.length) return

    // Optimistic update
    const newStages = [...stages]
    const [movedStage] = newStages.splice(currentIndex, 1)
    newStages.splice(newIndex, 0, movedStage)

    // Update stage_order for all affected stages
    const reorderedStages = newStages.map((s, i) => ({ ...s, stage_order: i }))
    setStages(reorderedStages)

    setIsReordering(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/flow-stages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stages: reorderedStages.map(s => ({ id: s.id, stage_order: s.stage_order })),
        }),
      })

      if (!res.ok) {
        // Revert on failure
        await fetchStages()
        const data = await res.json()
        throw new Error(data.error || 'Failed to reorder')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reorder stages'
      toast.error(message)
    } finally {
      setIsReordering(false)
    }
  }

  function startEditing(stage: FlowStage) {
    setEditingStage(stage.id)
    setEditFormData({
      name: stage.name,
      goal: stage.goal,
      sample_script: stage.sample_script || '',
      exit_criteria: stage.exit_criteria || '',
    })
    setExpandedStage(stage.id)
  }

  function cancelEditing() {
    setEditingStage(null)
    setEditFormData(emptyFormData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Conversation Flow</h2>
            <p className="text-sm text-muted-foreground">
              Define stages your intern follows during conversations
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={isDefault}>
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {/* Default notice */}
      {isDefault && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="text-muted-foreground">
            These are the default conversation stages. Add a custom stage to start configuring your own flow.
          </p>
        </div>
      )}

      {/* Stages list */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isExpanded = expandedStage === stage.id
          const isEditing = editingStage === stage.id
          const isFirst = index === 0
          const isLast = index === stages.length - 1

          return (
            <div
              key={stage.id}
              className={cn(
                'border rounded-lg transition-all',
                isExpanded ? 'ring-1 ring-primary/20' : 'hover:border-foreground/20'
              )}
            >
              {/* Collapsed header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => !isEditing && setExpandedStage(isExpanded ? null : stage.id)}
              >
                {/* Drag handle / reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  {!isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={isFirst || isReordering}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReorder(stage.id, 'up')
                        }}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={isLast || isReordering}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReorder(stage.id, 'down')
                        }}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {isDefault && (
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </div>

                {/* Stage number badge */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>

                {/* Stage name */}
                <div className="flex-1">
                  <p className="font-medium">{stage.name}</p>
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {stage.goal}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(stage)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteStageId(stage.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t">
                  {isEditing ? (
                    // Edit form
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Stage Name</Label>
                        <Input
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, name: e.target.value })
                          }
                          placeholder="e.g., Qualifying"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Goal</Label>
                        <Textarea
                          value={editFormData.goal}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, goal: e.target.value })
                          }
                          placeholder="What this stage aims to accomplish..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Sample Script (Optional)</Label>
                        <Textarea
                          value={editFormData.sample_script}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, sample_script: e.target.value })
                          }
                          placeholder="Example messages your intern might use..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Exit Criteria (Optional)</Label>
                        <Textarea
                          value={editFormData.exit_criteria}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, exit_criteria: e.target.value })
                          }
                          placeholder="When to move to the next stage..."
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveEdit(stage.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Read-only view
                    <div className="space-y-4 pt-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Goal</p>
                        <p className="text-sm mt-1">{stage.goal}</p>
                      </div>

                      {stage.sample_script && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Sample Script
                          </p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">
                            {stage.sample_script}
                          </p>
                        </div>
                      )}

                      {stage.exit_criteria && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Exit Criteria
                          </p>
                          <p className="text-sm mt-1">{stage.exit_criteria}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info card */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How It Works</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Each stage defines a step in the conversation journey</li>
          <li>Your intern uses the goal and sample script as guidance</li>
          <li>Exit criteria determine when to advance to the next stage</li>
        </ul>
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stage</DialogTitle>
            <DialogDescription>
              Define a new stage in your conversation flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStageName">Stage Name *</Label>
              <Input
                id="newStageName"
                value={newStageData.name}
                onChange={(e) =>
                  setNewStageData({ ...newStageData, name: e.target.value })
                }
                placeholder="e.g., Document Collection"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStageGoal">Goal *</Label>
              <Textarea
                id="newStageGoal"
                value={newStageData.goal}
                onChange={(e) =>
                  setNewStageData({ ...newStageData, goal: e.target.value })
                }
                placeholder="What this stage aims to accomplish..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStageSampleScript">Sample Script (Optional)</Label>
              <Textarea
                id="newStageSampleScript"
                value={newStageData.sample_script}
                onChange={(e) =>
                  setNewStageData({ ...newStageData, sample_script: e.target.value })
                }
                placeholder="Example messages your intern might use..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStageExitCriteria">Exit Criteria (Optional)</Label>
              <Textarea
                id="newStageExitCriteria"
                value={newStageData.exit_criteria}
                onChange={(e) =>
                  setNewStageData({ ...newStageData, exit_criteria: e.target.value })
                }
                placeholder="When to move to the next stage..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStage} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Stage'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStageId} onOpenChange={() => setDeleteStageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this stage from your conversation flow. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
