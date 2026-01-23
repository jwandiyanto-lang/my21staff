'use client'

import Link from 'next/link'
import { Ticket } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

interface PortalHeaderProps {
  userName: string
  userEmail: string
}

export function PortalHeader({ userName, userEmail }: PortalHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl flex items-center justify-between">
        <Link href="/portal/support" className="flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          <span className="font-semibold text-lg">Support Portal</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
