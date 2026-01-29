/**
 * Window status filter for 24-hour active window.
 *
 * Active = within 24 hours (can reply freely)
 * All = show everything
 */

'use client'

import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type WindowStatus = 'active' | 'all'

interface WindowStatusFilterProps {
  value: WindowStatus
  onChange: (value: WindowStatus) => void
  activeCount?: number
  totalCount?: number
}

export function WindowStatusFilter({
  value,
  onChange,
  activeCount = 0,
  totalCount = 0,
}: WindowStatusFilterProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1">
        <Button
          variant={value === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('active')}
          className="h-8"
        >
          Active
          {activeCount > 0 && (
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
              value === 'active' ? 'bg-primary-foreground/20' : 'bg-muted'
            )}>
              {activeCount}
            </span>
          )}
        </Button>
        <Button
          variant={value === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('all')}
          className="h-8"
        >
          All
          {totalCount > 0 && (
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
              value === 'all' ? 'bg-primary-foreground/20' : 'bg-muted'
            )}>
              {totalCount}
            </span>
          )}
        </Button>
      </div>
      {value === 'active' && (
        <p className="text-xs text-muted-foreground ml-auto">
          Showing conversations within 24 hours
        </p>
      )}
    </div>
  )
}
