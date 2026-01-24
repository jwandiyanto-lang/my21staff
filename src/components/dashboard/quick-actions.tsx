'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, MessageSquare, Users } from 'lucide-react'

interface QuickActionsProps {
  workspaceSlug: string
}

export function QuickActions({ workspaceSlug }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${workspaceSlug}/database?action=add`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${workspaceSlug}/inbox`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Inbox
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${workspaceSlug}/database`}>
              <Users className="h-4 w-4 mr-2" />
              Database
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
