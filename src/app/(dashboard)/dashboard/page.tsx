import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to my21staff</CardTitle>
            <CardDescription>
              Your WhatsApp CRM for lead management and two-way messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a workspace to get started, or create a new one.
            </p>
            {/* Workspace selector will be added in Phase 2 */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
