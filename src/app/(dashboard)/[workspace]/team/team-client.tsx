'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PermissionButton } from '@/components/ui/permission-button'
import { hasPermission } from '@/lib/permissions/check'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { UserPlus, Mail, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

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
  currentUserRole: WorkspaceRole
}

export function TeamClient({
  workspace,
  members,
  currentUserRole,
}: TeamClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!email.trim()) return

    setIsInviting(true)
    try {
      // TODO: Implement invite API
      toast.info(`Fitur undangan akan segera hadir untuk: ${email}`)
      setEmail('')
    } catch (error) {
      console.error('Failed to invite:', error)
      toast.error('Gagal mengirim undangan')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRoleId(memberId)
    try {
      const response = await fetch(`/api/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal mengubah role')
      }

      toast.success('Role berhasil diubah')
      router.refresh()
    } catch (error) {
      console.error('Failed to change role:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengubah role'
      )
    } finally {
      setChangingRoleId(null)
    }
  }

  const handleRemove = async (memberId: string) => {
    // TODO: Implement remove member
    toast.info('Fitur hapus anggota akan segera hadir')
  }

  const canChangeRole = hasPermission(currentUserRole, 'team:change_role')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Tim</h1>
        <p className="text-muted-foreground mt-1">
          Kelola anggota tim dan akses mereka
        </p>
      </div>

      {/* Invite Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Undang Anggota Tim</CardTitle>
          <CardDescription>
            Tambahkan anggota baru ke workspace via email
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
                  placeholder="rekan@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <PermissionButton
              permission="team:invite"
              userRole={currentUserRole}
              onClick={handleInvite}
              disabled={isInviting || !email.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isInviting ? 'Mengundang...' : 'Undang'}
            </PermissionButton>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anggota Tim</CardTitle>
          <CardDescription>
            {members.length} anggota di workspace ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Belum ada anggota tim. Undang seseorang untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profiles?.full_name || 'Tanpa Nama'}
                    </TableCell>
                    <TableCell>{member.profiles?.email || '-'}</TableCell>
                    <TableCell>
                      {member.role === 'owner' ? (
                        <Badge variant="default">owner</Badge>
                      ) : canChangeRole ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) =>
                            handleRoleChange(member.id, newRole)
                          }
                          disabled={changingRoleId === member.id}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="member">member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{member.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(member.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {member.role !== 'owner' && (
                        <PermissionButton
                          permission="team:remove"
                          userRole={currentUserRole}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemove(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </PermissionButton>
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
