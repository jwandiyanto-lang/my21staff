'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Contact {
  id: string
  name?: string
  email?: string
  phone?: string
  lead_status?: string
  tags?: string[]
  assigned_to?: string
  lead_score?: number
  metadata?: Record<string, any>
}

interface MergeContactsDialogProps {
  contact1: Contact
  contact2: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onMergeComplete?: () => void
}

// Fields that can be merged
const MERGE_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'lead_status', label: 'Status' },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'lead_score', label: 'Lead Score' },
] as const

export function MergeContactsDialog({
  contact1,
  contact2,
  open,
  onOpenChange,
  onMergeComplete,
}: MergeContactsDialogProps) {
  // Track which contact's value to use for each field
  // Initial state: no pre-selection (user must choose each field)
  const [selections, setSelections] = useState<Record<string, '1' | '2'>>({})

  const queryClient = useQueryClient()

  const mergeMutation = useMutation({
    mutationFn: async (data: { primaryId: string; secondaryId: string; fields: Record<string, any> }) => {
      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Merge failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Contacts merged successfully')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      onOpenChange(false)
      onMergeComplete?.()
    },
    onError: () => {
      toast.error('Failed to merge contacts')
    },
  })

  const handleMerge = () => {
    // Ensure all fields have selections
    const unselectedFields = MERGE_FIELDS.filter(f => !selections[f.key])
    if (unselectedFields.length > 0) {
      toast.error(`Please select a value for: ${unselectedFields.map(f => f.label).join(', ')}`)
      return
    }

    // Build merged contact data
    const mergedFields: Record<string, any> = {}
    for (const field of MERGE_FIELDS) {
      const source = selections[field.key] === '1' ? contact1 : contact2
      mergedFields[field.key] = source[field.key as keyof Contact]
    }

    // Merge tags (combine both)
    mergedFields.tags = [...new Set([...(contact1.tags || []), ...(contact2.tags || [])])]

    // Merge metadata (combine both, contact1 takes precedence)
    mergedFields.metadata = { ...(contact2.metadata || {}), ...(contact1.metadata || {}) }

    mergeMutation.mutate({
      primaryId: contact1.id,
      secondaryId: contact2.id,
      fields: mergedFields,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Merge Contacts</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select which value to keep for each field. The second contact will be deleted after merge.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {MERGE_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="font-medium pt-2">{field.label}</Label>
              <RadioGroup
                value={selections[field.key]}
                onValueChange={(value) => setSelections(prev => ({ ...prev, [field.key]: value as '1' | '2' }))}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="1" id={`${field.key}-1`} />
                  <Label htmlFor={`${field.key}-1`} className="flex-1 cursor-pointer">
                    {String(contact1[field.key as keyof Contact] || '(empty)')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="2" id={`${field.key}-2`} />
                  <Label htmlFor={`${field.key}-2`} className="flex-1 cursor-pointer">
                    {String(contact2[field.key as keyof Contact] || '(empty)')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ))}

          {/* Tags - auto-combined */}
          <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
            <Label className="font-medium pt-2">Tags</Label>
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Will combine tags from both:</p>
              <div className="flex flex-wrap gap-1">
                {[...new Set([...(contact1.tags || []), ...(contact2.tags || [])])].map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-primary/10 rounded text-xs">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={mergeMutation.isPending}>
            {mergeMutation.isPending ? 'Merging...' : 'Merge Contacts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
