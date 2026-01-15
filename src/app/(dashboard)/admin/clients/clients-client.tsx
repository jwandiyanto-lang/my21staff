'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  Plus,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WorkspaceMember {
  id: string
  user_id: string
  role: string
  must_change_password: boolean
  created_at: string
}

interface WorkspaceWithStats {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
  contact_count: number
  members: WorkspaceMember[]
}

interface ClientsPageClientProps {
  workspaces: WorkspaceWithStats[]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ClientsPageClient({ workspaces }: ClientsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalContacts = workspaces.reduce((sum, ws) => sum + ws.contact_count, 0)
  const totalMembers = workspaces.reduce((sum, ws) => sum + ws.members.length, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all client workspaces and users
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/60 backdrop-blur border-black/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workspaces.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Workspaces
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur border-black/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalContacts}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Contacts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur border-black/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Workspace List */}
      <div className="space-y-3">
        {filteredWorkspaces.map((workspace) => (
          <Card
            key={workspace.id}
            className="bg-white/60 backdrop-blur border-black/5 hover:bg-white/80 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {workspace.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {workspace.slug}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {workspace.contact_count} contacts
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created {formatDate(workspace.created_at)}
                    </span>
                  </div>
                </div>

                {/* Members preview */}
                <div className="flex items-center gap-2">
                  {workspace.members.slice(0, 3).map((member, idx) => (
                    <div
                      key={member.id}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        member.role === 'owner'
                          ? "bg-primary/20 text-primary"
                          : member.role === 'admin'
                          ? "bg-accent/20 text-accent"
                          : "bg-gray-100 text-gray-600"
                      )}
                      title={`${member.role}${member.must_change_password ? ' (pending password change)' : ''}`}
                    >
                      {member.role.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {workspace.members.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{workspace.members.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <Link href={`/${workspace.slug}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredWorkspaces.length === 0 && (
          <Card className="bg-white/60 backdrop-blur border-black/5">
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No workspaces found</p>
              <Link href="/admin/clients/new">
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
