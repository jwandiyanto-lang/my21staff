'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MergeContactsDialog } from '@/app/(dashboard)/[workspace]/database/merge-contacts-dialog'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types/database'
import { MOCK_CONTACTS } from '@/lib/mock-data'

interface MergeContactFlowProps {
  currentContact: Contact
  workspace: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMergeComplete?: () => void
}

// Get initials from name/phone
function getInitials(name: string | null | undefined, phone: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return phone.slice(-2)
}

// Avatar color based on phone - stable color that doesn't change
function getAvatarColor(phone: string): string {
  const colors = [
    'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
  ]
  let hash = 0
  for (let i = 0; i < phone.length; i++) {
    hash = phone.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function MergeContactFlow({
  currentContact,
  workspace,
  open,
  onOpenChange,
  onMergeComplete,
}: MergeContactFlowProps) {
  const [step, setStep] = useState<'search' | 'compare'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Search for contacts
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      if (isDev) {
        // Dev mode: search in mock contacts
        const filtered = MOCK_CONTACTS.filter(contact => {
          // Exclude current contact
          if (contact.id === currentContact.id) return false

          const searchLower = query.toLowerCase()
          return (
            contact.name?.toLowerCase().includes(searchLower) ||
            contact.phone?.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower)
          )
        })
        setSearchResults(filtered.slice(0, 10)) // Limit to 10 results
      } else {
        // Production: search via API
        const response = await fetch(
          `/api/contacts?workspace=${workspace}&search=${encodeURIComponent(query)}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          // Exclude current contact
          const filtered = (data.contacts || []).filter(
            (c: Contact) => c.id !== currentContact.id
          )
          setSearchResults(filtered)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [currentContact.id, workspace, isDev])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchContacts])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('search')
      setSearchQuery('')
      setSearchResults([])
      setSelectedContact(null)
    }
  }, [open])

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setStep('compare')
  }

  // Handle back to search
  const handleBackToSearch = () => {
    setStep('search')
    setSelectedContact(null)
  }

  // Handle merge complete
  const handleMergeComplete = () => {
    onMergeComplete?.()
    onOpenChange(false)
  }

  return (
    <>
      {/* Step 1: Search Dialog */}
      {step === 'search' && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[500px] h-[600px] flex flex-col gap-0 mx-4 p-0">
            <div className="p-6 pb-4">
              <DialogHeader>
                <DialogTitle>Merge Contact</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Search for a duplicate contact to merge with{' '}
                  <span className="font-medium">{currentContact.name || currentContact.phone}</span>
                </p>
              </DialogHeader>
            </div>

            {/* Search Input */}
            <div className="relative px-6 pb-4">
              <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results */}
            <ScrollArea className="flex-1 px-6 min-h-0">
              {searchQuery.trim() === '' ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Start typing to search for contacts
                    </p>
                  </div>
                </div>
              ) : searchResults.length === 0 && !isSearching ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No contacts found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {searchResults.map((contact) => {
                    const displayName = contact.name || contact.phone
                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                      >
                        <Avatar className={cn('h-10 w-10', getAvatarColor(contact.phone))}>
                          <AvatarFallback className="text-sm font-medium text-white bg-transparent">
                            {getInitials(contact.name, contact.phone)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{displayName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{contact.phone}</span>
                            {contact.email && (
                              <>
                                <span>•</span>
                                <span className="truncate">{contact.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end p-6 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Step 2: Compare Dialog */}
      {step === 'compare' && selectedContact && (
        <MergeContactsDialog
          contact1={currentContact}
          contact2={selectedContact}
          open={open}
          onOpenChange={(newOpen) => {
            if (!newOpen) {
              // When closing, go back to search or close entirely
              onOpenChange(false)
            }
          }}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </>
  )
}
