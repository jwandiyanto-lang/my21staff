'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Building2,
  Plus,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/types/database'

interface WorkspaceSwitcherProps {
  currentWorkspaceSlug: string
  isAdmin: boolean
}

export function WorkspaceSwitcher({ currentWorkspaceSlug, isAdmin }: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Pick<Workspace, 'id' | 'name' | 'slug'>[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchWorkspaces() {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .order('name')

      if (!error && data) {
        setWorkspaces(data)
      }
      setLoading(false)
    }

    fetchWorkspaces()
  }, [isAdmin, supabase])

  const currentWorkspace = workspaces.find(w => w.slug === currentWorkspaceSlug)

  const handleSelect = (slug: string) => {
    setIsOpen(false)
    router.push(`/${slug}`)
  }

  // Non-admin users don't see the switcher
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="h-10 bg-white/10 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative px-3 py-2">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1e3a24] hover:bg-[#264a2d] border border-white/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#F7931A]/20 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#F7931A]" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">
            {currentWorkspace?.name || 'Select workspace'}
          </p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-white/50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg border border-black/5 overflow-hidden">
            {/* Workspace list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace.slug)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-black/5 transition-colors",
                    workspace.slug === currentWorkspaceSlug && "bg-primary/5"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-left truncate">
                    {workspace.name}
                  </span>
                  {workspace.slug === currentWorkspaceSlug && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Add new client */}
            <div className="border-t border-black/5">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/admin/clients/new')
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-black/5 transition-colors text-primary"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Add New Client</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
