import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/server'
import { api } from '@/convex/_generated/api'
import {
  withTiming,
  createRequestMetrics,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

/**
 * GET /api/contacts/by-phone-convex?phone=628xxx&workspace_id=xxx
 *
 * Contact lookup API using Convex instead of Supabase.
 *
 * This is the Convex version of /api/contacts/by-phone for
 * performance benchmarking. It maintains identical interface to
 * the Supabase version for fair comparison.
 *
 * Authentication: X-API-Key header with CRM_API_KEY secret
 */
async function getHandler(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.CRM_API_KEY

    if (!expectedKey) {
      console.error('[ContactLookupConvex] CRM_API_KEY not configured')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const workspaceId = searchParams.get('workspace_id')

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing phone parameter' },
        { status: 400 }
      )
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace_id parameter' },
        { status: 400 }
      )
    }

    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Call Convex query directly via fetchQuery
    const metrics = createRequestMetrics()
    const queryStart = performance.now()

    const result = await fetchQuery(
      api.contacts.getContextByPhone,
      { phone: normalizedPhone, workspace_id: workspaceId }
    )

    const queryTime = Math.round(performance.now() - queryStart)
    logQuerySummary('/api/contacts/by-phone-convex', {
      ...metrics,
      queries: [{ name: 'convex.contacts.getContextByPhone', duration: queryTime }],
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ContactLookupConvex] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export wrapped handler with timing instrumentation
export const GET = withTiming('/api/contacts/by-phone-convex', getHandler)
