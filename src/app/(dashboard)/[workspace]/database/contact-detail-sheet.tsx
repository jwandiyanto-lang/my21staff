'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Contact } from '@/types/database'

interface ContactDetailSheetProps {
  contact: Contact | null
  workspace: { slug: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  contactTags?: string[]
  teamMembers?: unknown[]
}

/**
 * Contact Detail Sheet - Stubbed out during Supabase removal
 * TODO: Rebuild with Convex in Phase 2 (CRM Features)
 */
export function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
}: ContactDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {contact?.name || contact?.phone || 'Contact Details'}
          </SheetTitle>
        </SheetHeader>
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Contact details temporarily unavailable</p>
          <p className="text-xs mt-2">Being rebuilt with new architecture</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
