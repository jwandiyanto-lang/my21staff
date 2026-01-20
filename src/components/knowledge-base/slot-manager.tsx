'use client'

/**
 * SlotManager - Consultant availability slot management
 *
 * Placeholder component - full implementation in 05-02-PLAN
 */

interface TeamMember {
  id: string
  email: string
  full_name: string
}

interface SlotManagerProps {
  workspaceId: string
  teamMembers: TeamMember[]
}

export function SlotManager({ workspaceId, teamMembers }: SlotManagerProps) {
  return (
    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
      <p className="text-lg font-medium">Slot Manager</p>
      <p className="text-sm mt-2">
        Manage consultant availability slots
      </p>
      <p className="text-xs mt-4 opacity-70">
        Full UI coming in Plan 05-02
      </p>
    </div>
  )
}
