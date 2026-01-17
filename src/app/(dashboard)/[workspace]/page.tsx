import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserPlus, Calendar, Tag, ClipboardList } from 'lucide-react'

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    redirect('/dashboard')
  }

  // Get date boundaries
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch all stats in parallel
  const [
    { count: totalClients },
    { count: newToday },
    { count: newThisWeek },
    { count: newThisMonth },
    { data: allContacts },
    { data: upcomingTasks },
  ] = await Promise.all([
    // Total clients
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    // New today
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', todayStart),
    // New this week
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', weekStart),
    // New this month
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', monthStart),
    // All contacts for tag filtering
    supabase
      .from('contacts')
      .select('id, tags, created_at')
      .eq('workspace_id', workspace.id),
    // Upcoming tasks (notes with due dates, not completed)
    supabase
      .from('contact_notes')
      .select('id, content, due_date, contact_id')
      .eq('workspace_id', workspace.id)
      .not('due_date', 'is', null)
      .is('completed_at', null)
      .gte('due_date', todayStart)
      .order('due_date', { ascending: true })
      .limit(10),
  ])

  // Calculate 1on1 consultation tag counts
  const consultationTag = '1on1 consultation'
  const contactsWithTag = allContacts?.filter(c => c.tags?.includes(consultationTag)) || []
  const tagAllTime = contactsWithTag.length
  const tagToday = contactsWithTag.filter(c => c.created_at >= todayStart).length
  const tagThisWeek = contactsWithTag.filter(c => c.created_at >= weekStart).length
  const tagThisMonth = contactsWithTag.filter(c => c.created_at >= monthStart).length

  // Fetch contact details for tasks
  const taskContactIds = upcomingTasks?.map(t => t.contact_id).filter(Boolean) || []
  const { data: taskContacts } = taskContactIds.length > 0
    ? await supabase
        .from('contacts')
        .select('id, name, phone')
        .in('id', taskContactIds)
    : { data: [] }
  const contactMap = new Map((taskContacts || []).map(c => [c.id, c]))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">{workspace.name}</p>
      </div>

      {/* Client Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newToday || 0}</div>
            <p className="text-xs text-muted-foreground">Since midnight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Since Sunday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Since {new Date(monthStart).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
          </CardContent>
        </Card>
      </div>

      {/* 1on1 Consultation Tag Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          1on1 Consultation
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">All Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tagAllTime}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tagToday}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tagThisWeek}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tagThisMonth}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Upcoming Tasks
        </h2>
        <Card>
          <CardContent className="pt-6">
            {upcomingTasks && upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const contact = contactMap.get(task.contact_id)
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact?.name || contact?.phone || 'Unknown contact'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {task.due_date && new Date(task.due_date).toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming tasks. Add due dates to notes to see them here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
