'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OnboardingChecklistProps {
  workspaceSlug: string
  stats: {
    hasKapsoConnected: boolean
    hasContacts: boolean
    hasConversations: boolean
  }
}

type Stats = {
  hasKapsoConnected: boolean
  hasContacts: boolean
  hasConversations: boolean
}

const steps = [
  {
    id: 'connect',
    title: 'Connect WhatsApp',
    description: 'Integrate your WhatsApp Business number',
    check: (s: Stats) => s.hasKapsoConnected,
    href: (slug: string) => `/${slug}/team`,
  },
  {
    id: 'contacts',
    title: 'Add Contacts',
    description: 'Import or add your first contacts',
    check: (s: Stats) => s.hasContacts,
    href: (slug: string) => `/${slug}/database`,
  },
  {
    id: 'conversation',
    title: 'Start Conversation',
    description: 'Send your first message to a contact',
    check: (s: Stats) => s.hasConversations,
    href: (slug: string) => `/${slug}/inbox`,
  },
]

export function OnboardingChecklist({ workspaceSlug, stats }: OnboardingChecklistProps) {
  // Calculate completion
  const completedCount = steps.filter(step => step.check(stats)).length
  const allComplete = completedCount === steps.length

  // Auto-hide when all steps complete
  if (allComplete) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get Started with my21staff</CardTitle>
        <CardDescription>
          Complete the following steps to get started ({completedCount}/{steps.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const isComplete = step.check(stats)

          return (
            <Link
              key={step.id}
              href={step.href(workspaceSlug)}
              className={`
                flex items-center gap-4 p-4 rounded-lg border transition-all
                ${isComplete
                  ? 'bg-green-50 border-green-200 cursor-default'
                  : 'hover:bg-muted/50 border-muted-foreground/20 hover:border-border'
                }
              `}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isComplete ? 'text-green-700' : 'text-foreground'}`}>
                  {step.title}
                </p>
                <p className={`text-sm ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {step.description}
                </p>
              </div>

              {/* Arrow for incomplete steps */}
              {!isComplete && (
                <div className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
