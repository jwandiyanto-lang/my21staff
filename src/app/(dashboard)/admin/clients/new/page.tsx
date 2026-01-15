'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, User, Building2, Mail, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreatedClient {
  email: string
  password: string
  workspace: {
    name: string
    slug: string
  }
}

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdClient, setCreatedClient] = useState<CreatedClient | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      setCreatedClient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (createdClient) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="bg-white/60 backdrop-blur border-black/5">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Client Created Successfully!</CardTitle>
            <CardDescription>
              Share these credentials with your client. They will be required to change their password on first login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workspace Info */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-semibold">{createdClient.workspace.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Workspace slug: {createdClient.workspace.slug}
              </p>
            </div>

            {/* Credentials */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={createdClient.email}
                    readOnly
                    className="bg-white/50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdClient.email, 'email')}
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Temporary Password
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={createdClient.password}
                    readOnly
                    className="bg-white/50 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdClient.password, 'password')}
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Copy All */}
            <div className="pt-4 border-t border-black/5">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const text = `Workspace: ${createdClient.workspace.name}\nEmail: ${createdClient.email}\nPassword: ${createdClient.password}\n\nLogin at: ${window.location.origin}/login`
                  copyToClipboard(text, 'all')
                }}
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All Credentials
                  </>
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedClient(null)
                  setFormData({ fullName: '', email: '', businessName: '' })
                }}
              >
                Add Another Client
              </Button>
              <Link href="/admin/clients" className="flex-1">
                <Button className="w-full">
                  Back to Client List
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
        <p className="text-muted-foreground mt-1">
          Create a new client workspace with temporary login credentials
        </p>
      </div>

      {/* Form */}
      <Card className="bg-white/60 backdrop-blur border-black/5">
        <CardHeader>
          <CardTitle className="text-lg">Client Information</CardTitle>
          <CardDescription>
            Enter the client details. A temporary password will be generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100/80 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  placeholder="Acme Corp"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used as the workspace name
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-black/5">
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
