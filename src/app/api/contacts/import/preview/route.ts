import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { validateContactRow, ValidatedRow } from '@/lib/validations/csv'
import { normalizePhone } from '@/lib/utils/phone'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspace') as string

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing file or workspace' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Read file content
    const text = await file.text()

    // Parse CSV with PapaParse
    const { data, errors: parseErrors } = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    })

    if (parseErrors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', parseErrors },
        { status: 400 }
      )
    }

    // Validate each row
    const validatedRows: ValidatedRow[] = data.map((row, index) =>
      validateContactRow(row, index + 1) // Row numbers start at 1
    )

    // Check for duplicates within the file (by normalized phone)
    const phoneCount = new Map<string, number>()
    validatedRows.forEach(row => {
      if (row.valid && row.normalized) {
        const phone = row.normalized.phone
        phoneCount.set(phone, (phoneCount.get(phone) || 0) + 1)
      }
    })

    const duplicatesInFile = Array.from(phoneCount.values()).filter(count => count > 1).length

    // Mark duplicate rows
    const seenPhones = new Set<string>()
    validatedRows.forEach(row => {
      if (row.valid && row.normalized) {
        const phone = row.normalized.phone
        if (seenPhones.has(phone)) {
          row.valid = false
          row.errors.push({ path: 'phone', message: 'Duplicate phone number in file' })
        } else {
          seenPhones.add(phone)
        }
      }
    })

    const validRows = validatedRows.filter(r => r.valid).length
    const invalidRows = validatedRows.filter(r => !r.valid).length

    return NextResponse.json({
      totalRows: data.length,
      validRows,
      invalidRows,
      duplicatesInFile,
      preview: validatedRows.slice(0, 10), // First 10 for preview
      allValidated: validatedRows, // All rows for import confirmation
    })
  } catch (error) {
    console.error('CSV preview error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
