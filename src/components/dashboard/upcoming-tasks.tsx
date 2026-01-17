'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Loader2 } from 'lucide-react'
import { completeTaskWithFollowup } from '@/app/(dashboard)/[workspace]/actions'

interface Task {
  id: string
  content: string
  due_date: string | null
  contact_id: string
}

interface Contact {
  id: string
  name: string | null
  phone: string | null
}

interface UpcomingTasksProps {
  tasks: Task[]
  contactMap: Map<string, Contact>
  workspaceSlug: string
}

export function UpcomingTasks({ tasks: initialTasks, contactMap, workspaceSlug }: UpcomingTasksProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState<string | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [followupText, setFollowupText] = useState('')

  const handleOpenComplete = (task: Task) => {
    setCompletingTask(task)
    setFollowupText('')
  }

  const handleComplete = async () => {
    if (!completingTask) return

    setLoading(completingTask.id)
    try {
      await completeTaskWithFollowup(completingTask.id, followupText, workspaceSlug)
      setTasks(tasks.filter(t => t.id !== completingTask.id))
      setCompletingTask(null)
      setFollowupText('')
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleNavigateToContact = (contactId: string) => {
    router.push(`/${workspaceSlug}/database?contact=${contactId}`)
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => {
                const contact = contactMap.get(task.contact_id)
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full border border-muted-foreground/30 hover:bg-green-100 hover:border-green-500"
                      onClick={() => handleOpenComplete(task)}
                      disabled={loading === task.id}
                    >
                      {loading === task.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      )}
                    </Button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNavigateToContact(task.contact_id)}
                    >
                      <p className="text-sm font-medium truncate hover:underline">{task.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact?.name || contact?.phone || 'Unknown contact'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {task.due_date && new Date(task.due_date).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming tasks. Add due dates to notes to see them here.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!completingTask} onOpenChange={(open) => !open && setCompletingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Tugas</DialogTitle>
            <DialogDescription>
              {completingTask?.content}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Apa tindakan yang dilakukan?
            </label>
            <Textarea
              placeholder="Contoh: Sudah telepon, akan follow up minggu depan..."
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingTask(null)}>
              Batal
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!followupText.trim() || loading === completingTask?.id}
            >
              {loading === completingTask?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
