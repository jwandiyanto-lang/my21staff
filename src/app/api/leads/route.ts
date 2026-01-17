import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/utils/phone'

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

    const adminClient = createApiAdminClient()

    // Check if contact already exists by phone
    const { data: existingContact } = await adminClient
      .from('contacts')
      .select('id, tags, metadata')
      .eq('workspace_id', MY21STAFF_WORKSPACE_ID)
      .eq('phone', normalizedPhone)
      .single()

    if (existingContact) {
      // Update existing contact - merge tags and metadata
      const existingTags = existingContact.tags || []
      const mergedTags = [...new Set([...existingTags, ...tags])]
      const mergedMetadata = {
        ...(existingContact.metadata as Record<string, unknown> || {}),
        ...metadata,
        updated_from_pricing_form: new Date().toISOString(),
      }

      const { error: updateError } = await adminClient
        .from('contacts')
        .update({
          name: nama,
          tags: mergedTags,
          metadata: mergedMetadata,
        })
        .eq('id', existingContact.id)

      if (updateError) {
        console.error('Failed to update contact:', updateError)
        return NextResponse.json(
          { error: 'Gagal memperbarui data' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Data berhasil diperbarui',
        contactId: existingContact.id,
        isNew: false,
      })
    }

    // Create new contact
    const { data: newContact, error: insertError } = await adminClient
      .from('contacts')
      .insert({
        workspace_id: MY21STAFF_WORKSPACE_ID,
        name: nama,
        phone: normalizedPhone,
        tags,
        metadata: {
          ...metadata,
          created_from_pricing_form: new Date().toISOString(),
        },
        status: 'new',
        score: 0,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to create contact:', insertError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil disimpan',
      contactId: newContact.id,
      isNew: true,
    })
  } catch (error) {
    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
