'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { PermissionButton } from '@/components/ui/permission-button'
import { hasPermission } from '@/lib/permissions/check'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { UserPlus, Mail, Trash2, User } from 'lucide-react'
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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'member' })
  const [isInviting, setIsInviting] = useState(false)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) {
      toast.error('Nama dan email wajib diisi')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          name: inviteForm.name.trim(),
          role: inviteForm.role,
          workspaceId: workspace.id,
        }),
      })

      if (response.ok) {
        toast.success(`Undangan berhasil dikirim ke ${inviteForm.email.trim()}`)
        setInviteForm({ name: '', email: '', role: 'member' })
        setIsSheetOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengirim undangan')
      }
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
    if (!confirm('Hapus anggota ini dari workspace?')) return

    try {
      const response = await fetch(`/api/workspace-members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Anggota berhasil dihapus')
        router.refresh()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus anggota')
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Gagal menghapus anggota')
    }
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
          <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <DialogTrigger asChild>
              <PermissionButton
                permission="team:invite"
                userRole={currentUserRole}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Undang Anggota
              </PermissionButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Undang Anggota Baru</DialogTitle>
                <DialogDescription>
                  Masukkan email untuk mengirim undangan
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Nama</Label>
                  <Input
                    id="invite-name"
                    placeholder="Nama lengkap"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@perusahaan.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteForm.email.trim() || !inviteForm.name.trim()}
                  className="w-full"
                >
                  {isInviting ? 'Mengirim...' : 'Kirim Undangan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
