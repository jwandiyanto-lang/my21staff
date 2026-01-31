import { Badge } from '@/components/ui/badge'
import { Flame, Sun, Snowflake, CheckCircle } from 'lucide-react'

type LeadTemperature = 'hot' | 'warm' | 'lukewarm' | 'cold' | 'new' | 'converted'

interface StageBadgeProps {
  temperature: LeadTemperature
  className?: string
}

const temperatureConfig = {
  hot: {
    label: 'Hot',
    icon: Flame,
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  },
  warm: {
    label: 'Warm',
    icon: Sun,
    className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  lukewarm: {
    label: 'Lukewarm',
    icon: Sun,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  },
  cold: {
    label: 'Cold',
    icon: Snowflake,
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  new: {
    label: 'New',
    icon: Snowflake,
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  converted: {
    label: 'Converted',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  },
}

export function StageBadge({ temperature, className }: StageBadgeProps) {
  const config = temperatureConfig[temperature] || temperatureConfig.new
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className || ''} gap-1.5 font-semibold`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}
