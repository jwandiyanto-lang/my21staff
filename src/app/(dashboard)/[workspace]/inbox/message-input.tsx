'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SendHorizonal } from 'lucide-react'

export function MessageInput() {
  return (
    <div className="border-t p-4 bg-background">
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          disabled
          className="flex-1"
        />
        <Button disabled size="icon">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Sending messages coming in Phase 4
      </p>
    </div>
  )
}
