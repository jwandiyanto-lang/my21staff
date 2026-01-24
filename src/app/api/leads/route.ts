import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { normalizePhone } from '@/lib/phone/normalize'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// my21staff workspace ID for pricing form leads
const MY21STAFF_WORKSPACE_ID = process.env.NEXT_PUBLIC_PRICING_WORKSPACE_ID || '0318fda5-22c4-419b-bdd8-04471b818d17'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nama,
      whatsapp,
      jenisBisnis,
      dariManaTahu,
      leadSources,
      currentTracking,
      leadsPerMonth,
      masalahBisnis,
      teamSize,
      paket,
    } = body

    // Validate required fields
    if (!nama || !whatsapp) {
      return NextResponse.json(
        { error: 'Nama dan WhatsApp wajib diisi' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(whatsapp)

    // Build tags array
    const tags: string[] = ['pricing-form']
    if (paket) {
      tags.push(paket.toLowerCase())
    }

    // Build metadata object
    const metadata: Record<string, unknown> = {}
    if (jenisBisnis) metadata.jenis_bisnis = jenisBisnis
    if (dariManaTahu) metadata.dari_mana_tahu = dariManaTahu
    if (leadSources) metadata.lead_sources = leadSources
    if (currentTracking) metadata.current_tracking = currentTracking
    if (leadsPerMonth) metadata.leads_per_month = leadsPerMonth
    if (masalahBisnis) metadata.masalah_bisnis = masalahBisnis
    if (teamSize) metadata.team_size = teamSize
    if (paket) metadata.selected_plan = paket

    const result = await convex.mutation(api.mutations.upsertPricingFormContact, {
      workspace_id: MY21STAFF_WORKSPACE_ID,
      phone: normalizedPhone,
      name: nama,
      metadata,
      tags,
    })

    return NextResponse.json({
      success: true,
      message: result.isNew ? 'Data berhasil disimpan' : 'Data berhasil diperbarui',
      contactId: result.contact?._id,
      isNew: result.isNew,
    })
  } catch (error) {
    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
