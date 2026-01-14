'use client'

import { useState, useEffect } from 'react'
import { WebinarRegistrationForm } from './registration-form'

interface RegistrationSectionProps {
  webinarId: string
  workspaceId: string
  webinarTitle: string
  scheduledAt: string
  formattedDate: string
  isFull: boolean
}

export function RegistrationSection({
  webinarId,
  workspaceId,
  webinarTitle,
  scheduledAt,
  formattedDate,
  isFull,
}: RegistrationSectionProps) {
  // Start with null to avoid hydration mismatch - render nothing until client-side check
  const [isPast, setIsPast] = useState<boolean | null>(null)

  useEffect(() => {
    // Check on client side only to avoid server/client mismatch
    const scheduledDate = new Date(scheduledAt)
    const now = new Date()
    setIsPast(scheduledDate < now)
  }, [scheduledAt])

  // During SSR and initial hydration, show a loading state
  if (isPast === null) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (isPast) {
    return (
      <div className="text-center py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">This webinar has ended</h3>
        <p className="text-gray-600">
          This webinar took place on {formattedDate}. Check back for future events.
        </p>
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="text-center py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Full</h3>
        <p className="text-gray-600">
          This webinar has reached maximum capacity. Please check back for future events.
        </p>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Register Now</h2>
      <WebinarRegistrationForm
        webinarId={webinarId}
        workspaceId={workspaceId}
        webinarTitle={webinarTitle}
      />
    </>
  )
}
