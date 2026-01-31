'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface Stats {
  byTemperature: {
    hot: number
    warm: number
    lukewarm?: number
    cold: number
  }
  total: number
  avgScore: number
}

const tempColors = {
  hot: { bg: 'bg-red-500', label: 'Hot' },
  warm: { bg: 'bg-orange-500', label: 'Warm' },
  lukewarm: { bg: 'bg-yellow-500', label: 'Lukewarm' },
  cold: { bg: 'bg-blue-500', label: 'Cold' },
}

export function LeadQualityOverview({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const temps = stats.byTemperature
  const total = stats.total || 1 // Avoid division by zero

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lead Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total leads */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </div>

        {/* Distribution bar */}
        <div className="h-4 rounded-full overflow-hidden flex">
          {Object.entries(temps).map(([key, value]) => {
            const config = tempColors[key as keyof typeof tempColors]
            if (!config || !value) return null
            const width = (value / total) * 100
            return (
              <div
                key={key}
                className={`${config.bg} transition-all`}
                style={{ width: `${width}%` }}
                title={`${config.label}: ${value}`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(temps).map(([key, value]) => {
            const config = tempColors[key as keyof typeof tempColors]
            if (!config) return null
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                  <span>{config.label}</span>
                </div>
                <span className="font-medium">{value || 0}</span>
              </div>
            )
          })}
        </div>

        {/* Average score */}
        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-2xl font-bold">{stats.avgScore}/100</p>
        </div>
      </CardContent>
    </Card>
  )
}
