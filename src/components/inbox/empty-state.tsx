/**
 * Empty state shown when no conversation is selected in the inbox.
 *
 * Displays a WhatsApp-style centered message with icon prompting
 * the user to select a conversation from the list.
 */

import { MessageSquare } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-6">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            Select a conversation
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Select a conversation to start chatting and view message history
          </p>
        </div>
      </div>
    </div>
  )
}
