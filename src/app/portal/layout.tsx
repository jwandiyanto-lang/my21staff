import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortalHeader } from '@/components/portal/portal-header'
import { TawkChat } from '@/components/tawk-chat'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        userName={profile?.full_name || profile?.email || 'User'}
        userEmail={profile?.email || ''}
      />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {children}
      </main>
      {/* Tawk.to live chat - only on portal, not admin */}
      <TawkChat
        userName={profile?.full_name || undefined}
        userEmail={profile?.email || undefined}
      />
    </div>
  )
}
