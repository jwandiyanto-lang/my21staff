'use client'

import { Table, ColumnFiltersState } from '@tanstack/react-table'
import { StageFilter } from './stage-filter'
import { SearchInput } from './search-input'
import { DateRangeFilter } from './date-range-filter'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Lead } from './lead-columns'

interface LeadFiltersProps {
  globalFilter: string
  setGlobalFilter: (value: string) => void
  columnFilters: ColumnFiltersState
  setColumnFilters: (filters: ColumnFiltersState) => void
  table: Table<Lead>
}

export function LeadFilters({
  globalFilter,
  setGlobalFilter,
  columnFilters,
  setColumnFilters,
}: LeadFiltersProps) {
  // Get current filter values
  const stageFilter =
    (columnFilters.find((f) => f.id === 'leadTemperature')?.value as string[]) || []
  const dateFilter =
    (columnFilters.find((f) => f.id === 'created_at')?.value as number | null) || null

  // Check if any filters are active
  const hasActiveFilters = globalFilter !== '' || stageFilter.length > 0 || dateFilter !== null

  // Update stage filter
  const handleStageChange = (stages: string[]) => {
    const otherFilters = columnFilters.filter((f) => f.id !== 'leadTemperature')
    if (stages.length === 0) {
      setColumnFilters(otherFilters)
    } else {
      setColumnFilters([...otherFilters, { id: 'leadTemperature', value: stages }])
    }
  }

  // Update date filter
  const handleDateChange = (cutoff: number | null) => {
    const otherFilters = columnFilters.filter((f) => f.id !== 'created_at')
    if (cutoff === null) {
      setColumnFilters(otherFilters)
    } else {
      setColumnFilters([...otherFilters, { id: 'created_at', value: cutoff }])
    }
  }

  // Clear all filters
  const handleClearAll = () => {
    setGlobalFilter('')
    setColumnFilters([])
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Stage Filter */}
      <StageFilter value={stageFilter} onChange={handleStageChange} />

      {/* Search Input */}
      <div className="flex-1 min-w-[200px] max-w-md">
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search name or phone..."
        />
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter value={dateFilter} onChange={handleDateChange} />

      {/* Clear All Button (only shown when filters are active) */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleClearAll}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
          Clear all
        </Button>
      )}
    </div>
  )
}
