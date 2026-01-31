'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { StageBadge } from './stage-badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Eye } from 'lucide-react'

export type Lead = {
  _id: string
  phone: string
  name: string
  leadStatus: string
  leadScore: number
  leadTemperature: 'hot' | 'warm' | 'lukewarm' | 'cold' | 'new' | 'converted'
  businessType?: string
  lastActivityAt?: number
  created_at: number
}

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-bold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const phone = row.original.phone
      return (
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground font-mono">{phone}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'leadTemperature',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-bold"
        >
          Stage
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const temperature = row.getValue('leadTemperature') as Lead['leadTemperature']
      return <StageBadge temperature={temperature} />
    },
    filterFn: (row, id, value: string[]) => {
      if (!value || value.length === 0) return true
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'leadScore',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-bold"
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue('leadScore') as number
      return (
        <div className="font-mono font-semibold">
          {score}
          <span className="text-muted-foreground">/100</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'businessType',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-bold"
        >
          Business Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const businessType = row.getValue('businessType') as string | undefined
      return (
        <span className="text-sm">
          {businessType || <span className="text-muted-foreground">—</span>}
        </span>
      )
    },
  },
  {
    accessorKey: 'created_at',
    // Hidden column used only for date range filtering
    enableHiding: true,
    filterFn: (row, id, value: number | null) => {
      if (!value) return true
      const cellValue = row.getValue(id) as number
      return cellValue >= value
    },
  },
  {
    accessorKey: 'lastActivityAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-bold"
        >
          Last Active
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lastActivityAt = row.getValue('lastActivityAt') as number | undefined
      if (!lastActivityAt) {
        return <span className="text-muted-foreground text-sm">Never</span>
      }
      return (
        <span className="text-sm">
          {formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.lastActivityAt || 0
      const b = rowB.original.lastActivityAt || 0
      return a - b
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          View
        </Button>
      )
    },
  },
]
