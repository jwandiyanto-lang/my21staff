'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TeamMember {
  id: string
  role: string
  created_at: string
  profiles: {
    id: string
    email: string | null
    full_name: string | null
  } | null
}

interface TeamClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  members: TeamMember[]
}

export function TeamClient({ workspace, members }: TeamClientProps) {
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) return

    setIsInviting(true)
    try {
      // TODO: Implement invite API
      alert(`Invite functionality coming soon for: ${email}`)
      setEmail('')
    } catch (error) {
      console.error('Failed to invite:', error)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team members and their access
        </p>
      </div>

      {/* Invite Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Invite Team Member</CardTitle>
          <CardDescription>
            Add a new member to your workspace by email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleInvite} disabled={isInviting || !email.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isInviting ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No team members yet. Invite someone to get started.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profiles?.full_name || 'Unnamed'}
                    </TableCell>
                    <TableCell>{member.profiles?.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {member.role !== 'owner' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
