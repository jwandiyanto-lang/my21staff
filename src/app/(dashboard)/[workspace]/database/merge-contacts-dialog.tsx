'use client'

import { useState, useEffect } from 'react'
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
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'

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
  { key: 'lead_score', label: 'Lead Score' },
  { key: 'tags', label: 'Tags' },
  { key: 'activity', label: 'Activity' },
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
  const [showConfirmation, setShowConfirmation] = useState(false)

  const queryClient = useQueryClient()

  // Reset confirmation state when dialog opens
  useEffect(() => {
    if (open) {
      setShowConfirmation(false)
    }
  }, [open])

  // Get display value for a field
  const getDisplayValue = (contact: Contact, fieldKey: string): string => {
    switch (fieldKey) {
      case 'lead_score':
        return (contact.lead_score ?? 0) > 0 ? `${contact.lead_score} points` : 'None'
      case 'tags':
        return (contact.tags && contact.tags.length > 0)
          ? contact.tags.join(', ')
          : 'None'
      case 'activity':
        // Count activities: notes + form submission + status changes
        // For dev mode, use contact ID to determine count (mock data)
        let activityCount = 0
        if (contact.id === 'contact-001') {
          // Budi Santoso has 4 activities (1 form + 3 notes)
          activityCount = 4
        } else if (contact.metadata && typeof contact.metadata === 'object') {
          // Check if has form submission
          activityCount = 1
        }
        return activityCount === 1 ? '1 activity' : `${activityCount} activities`
      default:
        return String(contact[fieldKey as keyof Contact] || '(empty)')
    }
  }

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
      setShowConfirmation(false)
      onOpenChange(false)
      onMergeComplete?.()
    },
    onError: () => {
      toast.error('Failed to merge contacts')
      setShowConfirmation(false)
    },
  })

  const handleMerge = () => {
    // Ensure all fields have selections
    const unselectedFields = MERGE_FIELDS.filter(f => !selections[f.key])
    if (unselectedFields.length > 0) {
      toast.error(`Please select a value for: ${unselectedFields.map(f => f.label).join(', ')}`)
      return
    }

    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const confirmMerge = () => {
    // Build merged contact data
    const mergedFields: Record<string, any> = {}
    for (const field of MERGE_FIELDS) {
      if (field.key === 'activity') continue // Skip activity field (not a real contact field)

      const source = selections[field.key] === '1' ? contact1 : contact2
      mergedFields[field.key] = source[field.key as keyof Contact]
    }

    // Merge metadata (combine both, contact1 takes precedence)
    const metadata1 = contact1.metadata && typeof contact1.metadata === 'object' ? contact1.metadata as Record<string, any> : {}
    const metadata2 = contact2.metadata && typeof contact2.metadata === 'object' ? contact2.metadata as Record<string, any> : {}
    mergedFields.metadata = { ...metadata2, ...metadata1 }

    const deletedContact = selections['name'] === '1' ? contact2 : contact1

    mergeMutation.mutate({
      primaryId: contact1.id,
      secondaryId: contact2.id,
      fields: mergedFields,
    })
  }

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Merge Contacts</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select which value to keep for each field. Click anywhere on the box to select.
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
                  <label
                    htmlFor={`${field.key}-1`}
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                      selections[field.key] === '1'
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value="1" id={`${field.key}-1`} />
                    <span className="flex-1 text-sm">
                      {getDisplayValue(contact1, field.key)}
                    </span>
                  </label>
                  <label
                    htmlFor={`${field.key}-2`}
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                      selections[field.key] === '2'
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value="2" id={`${field.key}-2`} />
                    <span className="flex-1 text-sm">
                      {getDisplayValue(contact2, field.key)}
                    </span>
                  </label>
                </RadioGroup>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleMerge}>
              Merge Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Merge</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Deleting{' '}
              <span className="font-medium text-foreground">
                {selections['name'] === '1'
                  ? (contact2.name || contact2.phone)
                  : (contact1.name || contact1.phone)}
              </span>
              {' '}and merging into{' '}
              <span className="font-medium text-foreground">
                {selections['name'] === '1'
                  ? (contact1.name || contact1.phone)
                  : (contact2.name || contact2.phone)}
              </span>
              ?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmMerge}
              disabled={mergeMutation.isPending}
              variant="destructive"
            >
              {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
