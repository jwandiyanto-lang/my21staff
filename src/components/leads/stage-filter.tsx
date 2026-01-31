'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Flame, Sun, Snowflake, CheckCircle } from 'lucide-react'

const STAGES = [
  {
    value: 'new',
    label: 'New',
    color: 'bg-blue-500',
    icon: Snowflake,
  },
  {
    value: 'warm',
    label: 'Warm',
    color: 'bg-orange-500',
    icon: Sun,
  },
  {
    value: 'hot',
    label: 'Hot',
    color: 'bg-red-500',
    icon: Flame,
  },
  {
    value: 'converted',
    label: 'Converted',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
] as const

interface StageFilterProps {
  value: string[]
  onChange: (stages: string[]) => void
}

export function StageFilter({ value, onChange }: StageFilterProps) {
  const handleCheckedChange = (checked: boolean, stageValue: string) => {
    if (checked) {
      onChange([...value, stageValue])
    } else {
      onChange(value.filter((s) => s !== stageValue))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          Stage
          {value.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {value.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3" align="start">
        <div className="space-y-2">
          {STAGES.map((stage) => {
            const Icon = stage.icon
            return (
              <div key={stage.value} className="flex items-center space-x-2 py-1.5">
                <Checkbox
                  id={`stage-${stage.value}`}
                  checked={value.includes(stage.value)}
                  onCheckedChange={(checked) =>
                    handleCheckedChange(checked as boolean, stage.value)
                  }
                />
                <label
                  htmlFor={`stage-${stage.value}`}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <Icon className="w-3.5 h-3.5" />
                  {stage.label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
