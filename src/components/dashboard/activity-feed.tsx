'use client'

import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StickyNote, Loader2 } from 'lucide-react'
import { formatDistanceWIB } from '@/lib/utils/timezone'
import Link from 'next/link'
import type { Id } from 'convex/_generated/dataModel'

interface ActivityFeedProps {
  workspaceId: Id<'workspaces'>
  workspaceSlug: string
}

export function ActivityFeed({ workspaceId, workspaceSlug }: ActivityFeedProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.listActivity,
    { workspace_id: workspaceId as any },
    { initialNumItems: 20 }
  )

  // Loading first page
  if (status === 'LoadingFirstPage') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Belum ada aktivitas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Activity items */}
        {results.map((activity) => (
          <Link
            key={activity._id}
            href={`/${workspaceSlug}/database?contact=${activity.contact_id}`}
            className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-0.5">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Note content */}
                <p className="text-sm line-clamp-2 mb-1">
                  {activity.content}
                </p>

                {/* Contact name and timestamp */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.contact && (
                    <>
                      <span className="font-medium">{activity.contact.name}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDistanceWIB(new Date(activity.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Loading more indicator */}
        {status === 'LoadingMore' && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Load more button */}
        {status === 'CanLoadMore' && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              onClick={() => loadMore(10)}
              className="w-full"
            >
              Muat lebih banyak
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
