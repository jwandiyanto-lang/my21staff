import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { createApiAdminClient } from '@/lib/supabase/server'
import { ValidatedRow } from '@/lib/validations/csv'

interface ImportRequest {
  workspace: string
  rows: ValidatedRow[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()
    const { workspace: workspaceId, rows } = body

    if (!workspaceId || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Missing workspace or rows' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Filter to only valid rows with normalized data
    const validRows = rows.filter(r => r.valid && r.normalized)

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows to import' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
    const supabase = createApiAdminClient()

    const results = { created: 0, updated: 0, errors: [] as string[] }

    // Process in batches of 50
    for (let i = 0; i < validRows.length; i += 50) {
      const batch = validRows.slice(i, i + 50)
      const phones = batch.map(r => r.normalized!.phone)

      // Get existing contacts by phone
      const { data: existing, error: fetchError } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('workspace_id', workspaceId)
        .in('phone', phones)

      if (fetchError) {
        results.errors.push(`Batch ${Math.floor(i / 50) + 1}: Failed to fetch existing contacts`)
        continue
      }

      const existingPhones = new Set(existing?.map(c => c.phone) || [])
      const existingByPhone = new Map(existing?.map(c => [c.phone, c.id]) || [])

      // Split into inserts and updates
      const toInsert = batch.filter(r => !existingPhones.has(r.normalized!.phone))
      const toUpdate = batch.filter(r => existingPhones.has(r.normalized!.phone))

      // Batch insert new contacts
      if (toInsert.length > 0) {
        const insertData = toInsert.map(r => ({
          workspace_id: workspaceId,
          phone: r.normalized!.phone,
          name: (r.data.name as string) || null,
          email: (r.data.email as string) || null,
          tags: r.normalized!.tags,
          lead_status: (r.data.lead_status as string) || 'new',
          lead_score: Number(r.data.lead_score) || 0,
        }))

        const { error: insertError } = await supabase
          .from('contacts')
          .insert(insertData)

        if (insertError) {
          results.errors.push(`Failed to insert ${toInsert.length} contacts: ${insertError.message}`)
        } else {
          results.created += toInsert.length
        }
      }

      // Update existing contacts one by one (to handle different fields per row)
      for (const row of toUpdate) {
        const contactId = existingByPhone.get(row.normalized!.phone)
        if (!contactId) continue

        const updateData: Record<string, unknown> = {}

        // Only update non-empty fields
        if (row.data.name) updateData.name = row.data.name
        if (row.data.email) updateData.email = row.data.email
        if (row.normalized!.tags.length > 0) updateData.tags = row.normalized!.tags
        if (row.data.lead_status) updateData.lead_status = row.data.lead_status
        if (row.data.lead_score !== undefined && row.data.lead_score !== null && row.data.lead_score !== '') {
          updateData.lead_score = Number(row.data.lead_score)
        }

        if (Object.keys(updateData).length === 0) {
          results.updated++ // Count as updated even if no changes
          continue
        }

        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId)

        if (updateError) {
          results.errors.push(`Failed to update contact ${row.normalized!.phone}: ${updateError.message}`)
        } else {
          results.updated++
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}
