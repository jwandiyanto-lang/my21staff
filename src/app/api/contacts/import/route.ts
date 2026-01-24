import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { normalizePhone } from '@/lib/phone/normalize'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface CSVRow {
  name?: string
  phone?: string
  email?: string
  lead_status?: string
  lead_score?: string | number
  tags?: string
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspace_id') as string

    if (!file || !workspaceId) {
      return NextResponse.json({ error: 'File and workspace_id required' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    let imported = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: CSVRow = {}
      headers.forEach((h, idx) => {
        row[h as keyof CSVRow] = values[idx] || ''
      })

      const phone = row.phone
      if (!phone) {
        skipped++
        continue
      }

      const normalized = normalizePhone(phone) || phone

      try {
        await convex.mutation(api.mutations.upsertContactForImport, {
          workspace_id: workspaceId,
          phone,
          phone_normalized: normalized,
          name: row.name || undefined,
          email: row.email || undefined,
          lead_status: row.lead_status || 'new',
          lead_score: row.lead_score ? Number(row.lead_score) : 0,
          tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
        })
        imported++
      } catch (error) {
        console.error('Failed to import contact:', error)
        skipped++
      }
    }

    return NextResponse.json({ imported, skipped })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
