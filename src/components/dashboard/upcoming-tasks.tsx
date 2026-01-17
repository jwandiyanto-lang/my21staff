'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { completeTask } from '@/app/(dashboard)/[workspace]/actions'

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
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState<string | null>(null)

  const handleComplete = async (taskId: string) => {
    setLoading(taskId)
    try {
      await completeTask(taskId, workspaceSlug)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
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
                    onClick={() => handleComplete(task.id)}
                    disabled={loading === task.id}
                  >
                    {loading === task.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.content}</p>
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
  )
}
