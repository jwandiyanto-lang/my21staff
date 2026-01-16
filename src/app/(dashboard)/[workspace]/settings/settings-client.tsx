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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Check, AlertCircle, UserPlus, Mail, Trash2, Users, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface WorkspaceSettings {
  kapso_api_key?: string
}

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

interface SettingsClientProps {
  workspace: {
    id: string
    name: string
    slug: string
    kapso_phone_id: string | null
    settings: WorkspaceSettings | null
  }
  members: TeamMember[]
}

export function SettingsClient({ workspace, members }: SettingsClientProps) {
  // WhatsApp settings state
  const [phoneId, setPhoneId] = useState(workspace.kapso_phone_id || '')
  const [apiKey, setApiKey] = useState(workspace.settings?.kapso_api_key || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Team invite state
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const isConnected = !!workspace.kapso_phone_id && !!workspace.settings?.kapso_api_key

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kapso_phone_id: phoneId,
          settings: { kapso_api_key: apiKey },
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace settings and team
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
            <Badge variant="secondary" className="ml-1 text-xs">
              {members.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* WhatsApp / Meta Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                    <CardDescription>
                      Connect your WhatsApp Business account via Meta
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneId">Meta Phone Number ID</Label>
                <Input
                  id="phoneId"
                  placeholder="Enter your Meta WhatsApp Phone Number ID"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Meta Business Suite under WhatsApp settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your secure API key for WhatsApp messaging
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Settings saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Invite Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invite Team Member</CardTitle>
              <CardDescription>
                Add a new member to your workspace by email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="inviteEmail" className="sr-only">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="inviteEmail"
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
