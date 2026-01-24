'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MessageSquare, UserCheck, UserX } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalContacts: number
    totalConversations: number
    activeConversations: number
    statusBreakdown: {
      new?: number
      hot?: number
      warm?: number
      cold?: number
      won?: number
      lost?: number
    }
  }
  timeFilter: 'week' | 'month' | 'all'
  onTimeFilterChange: (filter: 'week' | 'month' | 'all') => void
}

export function StatsCards({ stats, timeFilter, onTimeFilterChange }: StatsCardsProps) {
  return (
    <div className="space-y-4">
      {/* Header with time filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Statistik</h2>
        <Tabs value={timeFilter} onValueChange={(v) => onTimeFilterChange(v as any)}>
          <TabsList>
            <TabsTrigger value="week">7 Hari</TabsTrigger>
            <TabsTrigger value="month">30 Hari</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Kontak"
          value={stats.totalContacts}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Percakapan"
          value={stats.totalConversations}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Hot Leads"
          value={stats.statusBreakdown.hot || 0}
          icon={<UserCheck className="h-4 w-4 text-green-600" />}
          valueClassName="text-green-600"
        />
        <StatCard
          title="Cold Leads"
          value={stats.statusBreakdown.cold || 0}
          icon={<UserX className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  valueClassName?: string
}

function StatCard({ title, value, icon, valueClassName }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>
          {value.toLocaleString('id-ID')}
        </div>
      </CardContent>
    </Card>
  )
}
