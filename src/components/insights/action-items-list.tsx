'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react'

interface Action {
  _id: string | any
  action_type: string
  priority: number
  urgency: 'immediate' | 'today' | 'this_week'
  reason: string
  suggested_message?: string
  status: string
  [key: string]: any // Allow additional properties from Convex
}

const urgencyConfig = {
  immediate: { label: 'Immediate', icon: AlertTriangle, className: 'bg-red-100 text-red-700' },
  today: { label: 'Today', icon: Clock, className: 'bg-orange-100 text-orange-700' },
  this_week: { label: 'This Week', icon: Calendar, className: 'bg-blue-100 text-blue-700' },
}

export function ActionItemsList({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No pending actions. Great job staying on top of follow-ups!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Action Items</span>
          <Badge variant="secondary">{actions.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action, index) => {
            const urgency = urgencyConfig[action.urgency]
            const UrgencyIcon = urgency.icon

            return (
              <div key={action._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Badge className={urgency.className}>
                        <UrgencyIcon className="h-3 w-3 mr-1" />
                        {urgency.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Priority: {action.priority}/100
                      </span>
                    </div>
                    <p className="text-sm font-medium">{action.reason}</p>
                    {action.suggested_message && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Suggested message:</p>
                        <p className="text-sm italic">&quot;{action.suggested_message}&quot;</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
