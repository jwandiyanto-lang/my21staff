import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { mockWebinars, isDevMode, MOCK_WORKSPACE } from '@/lib/mock-data'
import type { Webinar, Workspace } from '@/types/database'
import { WebinarRegistrationForm } from './registration-form'

interface WebinarPageProps {
  params: Promise<{ workspace: string; slug: string }>
}

// Extended type with registration count for checking limits
interface WebinarWithCount extends Webinar {
  registration_count: number
}

export default async function WebinarPage({ params }: WebinarPageProps) {
  const { workspace: workspaceSlug, slug } = await params

  let webinar: WebinarWithCount | null = null
  let workspaceName: string = ''
  let workspaceId: string = ''

  if (isDevMode()) {
    // Dev mode: lookup from mockWebinars
    if (workspaceSlug === MOCK_WORKSPACE.slug || workspaceSlug === 'demo') {
      const found = mockWebinars.find(
        (w) => w.slug === slug && w.status === 'published'
      )
      if (found) {
        webinar = { ...found, registration_count: 12 } // Mock registration count
      }
      workspaceName = MOCK_WORKSPACE.name
      workspaceId = MOCK_WORKSPACE.id
    }
  } else {
    // Production: fetch from Supabase
    const supabase = await createClient()

    // First get the workspace by slug
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('slug', workspaceSlug)
      .single()

    if (wsError || !workspaceData) {
      notFound()
    }

    const workspace = workspaceData as Pick<Workspace, 'id' | 'name'>
    workspaceName = workspace.name
    workspaceId = workspace.id

    // Then fetch the webinar by workspace_id and slug with registration count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as unknown as any
    const { data: webinarData, error: webinarError } = await client
      .from('webinars')
      .select(`
        *,
        webinar_registrations (count)
      `)
      .eq('workspace_id', workspace.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (webinarError || !webinarData) {
      notFound()
    }

    webinar = {
      ...webinarData,
      registration_count: webinarData.webinar_registrations?.[0]?.count ?? 0,
    } as WebinarWithCount
  }

  // If no webinar found or not published, return 404
  if (!webinar || webinar.status !== 'published') {
    notFound()
  }

  // Check if webinar is in the future
  const scheduledDate = new Date(webinar.scheduled_at)
  const now = new Date()
  const isPast = scheduledDate < now

  // Calculate spots remaining
  const spotsRemaining = webinar.max_registrations
    ? Math.max(0, webinar.max_registrations - webinar.registration_count)
    : null
  const isFull = spotsRemaining === 0

  const formattedDate = format(scheduledDate, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(scheduledDate, 'h:mm a')

  // Format duration nicely
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Cover Image */}
        {webinar.cover_image_url && (
          <div className="mb-8 -mx-4 sm:-mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={webinar.cover_image_url}
              alt={webinar.title}
              className="w-full h-48 sm:h-64 object-cover sm:rounded-lg"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {webinar.title}
          </h1>

          {/* Date and Time */}
          <div className="bg-white rounded-lg p-4 shadow-sm border mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-medium text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="font-medium text-gray-900">{formattedTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-medium text-gray-900">{formatDuration(webinar.duration_minutes)}</p>
              </div>
              {spotsRemaining !== null && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Spots remaining</p>
                  <p className={`font-medium ${spotsRemaining <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                    {spotsRemaining} of {webinar.max_registrations}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Hosted by {workspaceName}
          </p>
        </header>

        {/* Description */}
        {webinar.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this webinar</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {webinar.description}
            </p>
          </div>
        )}

        {/* Registration Form or Message */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          {isPast ? (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">This webinar has ended</h3>
              <p className="text-gray-600">
                This webinar took place on {formattedDate}. Check back for future events.
              </p>
            </div>
          ) : isFull ? (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Full</h3>
              <p className="text-gray-600">
                This webinar has reached maximum capacity. Please check back for future events.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Register Now</h2>
              <WebinarRegistrationForm
                webinarId={webinar.id}
                workspaceId={workspaceId}
                webinarTitle={webinar.title}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by {workspaceName}
          </p>
        </footer>
      </div>
    </main>
  )
}
