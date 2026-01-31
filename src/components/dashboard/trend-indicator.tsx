import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface TrendIndicatorProps {
  value: number // Percentage change (can be negative)
  period?: string // e.g., "vs last week"
  showValue?: boolean
}

export function TrendIndicator({ value, period, showValue = true }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNeutral = value === 0

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="h-4 w-4" />
        {showValue && <span>0%</span>}
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      {showValue && <span>{Math.abs(value)}%</span>}
      {period && <span className="text-muted-foreground">{period}</span>}
    </div>
  )
}
