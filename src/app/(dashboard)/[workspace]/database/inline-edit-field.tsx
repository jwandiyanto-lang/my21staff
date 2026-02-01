'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditFieldProps {
  value: string | undefined | null
  onSave: (value: string) => Promise<void>
  label?: string
  placeholder?: string
  multiline?: boolean
  className?: string
  valueClassName?: string
}

export function InlineEditField({
  value,
  onSave,
  label,
  placeholder = 'Click to edit',
  multiline = false,
  className,
  valueClassName,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Sync local value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value || '')
    }
  }, [value, isEditing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Select all text
      if ('select' in inputRef.current) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  const handleSave = async () => {
    if (localValue === (value || '')) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(localValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
      setLocalValue(value || '') // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalValue(value || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className={cn('group', className)}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}
      {isEditing ? (
        <div className="relative">
          <InputComponent
            ref={inputRef as any}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={cn(
              'text-sm',
              multiline ? 'min-h-[80px] resize-none' : 'h-8',
              valueClassName
            )}
            placeholder={placeholder}
          />
          {isSaving && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={cn(
            'px-3 py-2 border border-transparent rounded cursor-pointer min-h-[32px] flex items-center justify-between gap-2',
            'hover:border-muted-foreground/20 hover:bg-muted/50 transition-colors',
            valueClassName
          )}
        >
          <span className={cn('text-sm', !value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      )}
    </div>
  )
}
