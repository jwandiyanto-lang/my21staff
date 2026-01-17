import Papa from 'papaparse'

const TEMPLATE_HEADERS = [
  'name',
  'phone',
  'email',
  'tags',
  'lead_status',
  'lead_score',
]

const TEMPLATE_EXAMPLE = [
  {
    name: 'John Doe',
    phone: '+6281234567890',
    email: 'john@example.com',
    tags: 'hot-lead, instagram',
    lead_status: 'warm',
    lead_score: '75',
  },
]

export async function GET() {
  // Generate CSV with headers and example row
  const csv = Papa.unparse({
    fields: TEMPLATE_HEADERS,
    data: TEMPLATE_EXAMPLE,
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts-template.csv"',
    },
  })
}
