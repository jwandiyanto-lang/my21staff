'use client'

import { Building2 } from 'lucide-react'

interface WorkspaceSwitcherProps {
  currentWorkspaceSlug: string
  isAdmin: boolean
}

export function WorkspaceSwitcher({ currentWorkspaceSlug, isAdmin }: WorkspaceSwitcherProps) {
  // Non-admin users don't see the switcher
  if (!isAdmin) {
    return null
  }

  // Simplified version: just display current workspace
  // Multi-workspace switching can be added later when rebuilt with Convex
  return (
    <div className="px-3 py-2">
      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1e3a24] border border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#F7931A]/20 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#F7931A]" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">
            {currentWorkspaceSlug}
          </p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">
            Workspace
          </p>
        </div>
      </div>
    </div>
  )
}
