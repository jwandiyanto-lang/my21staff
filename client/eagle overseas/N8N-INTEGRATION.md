# Eagle Overseas - n8n Integration & Dashboard

## n8n Workflow Overview

**URL:** http://100.113.96.25:5678 (via Tailscale)

### Workflow: Google Sheets → Supabase Sync

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Google Sheets  │───▶│  n8n Transform  │───▶│    Supabase     │
│  (Form Response)│    │  (Score Calc)   │    │   (contacts)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Google Form Fields

### Form Structure (Indonesian)

| Field Name | Type | Options |
|------------|------|---------|
| Nama | Text | Free text |
| No WhatsApp | Phone | +62... format |
| Email | Email | Free text |
| Level Bahasa Inggris | Dropdown | Pemula, Menengah, Mahir |
| Budget | Dropdown | <100jt, 100-300jt, 300-500jt, >500jt |
| Kapan Mau Berangkat | Dropdown | <3 bulan, 3-6 bulan, 6-12 bulan, >1 tahun |
| Aktivitas | Dropdown | Pelajar, Bekerja |
| Negara Tujuan | Dropdown | UK, Australia, USA, Kanada, dll |
| Remardk | Text | Free text (notes) |

### Google Sheet Columns

```
A: Timestamp
B: Nama
C: No WhatsApp
D: Email
E: Level Bahasa Inggris
F: Budget
G: Kapan Mau Berangkat
H: Aktivitas
I: Negara Tujuan
J: Remardk
```

---

## n8n Data Transformation

### Input (from Google Sheets)

```json
{
  "Nama": "John Doe",
  "No WhatsApp": "+6281234567890",
  "Email": "john@example.com",
  "Level Bahasa Inggris": "Menengah",
  "Budget": "100-300jt",
  "Kapan Mau Berangkat": "3-6 bulan",
  "Aktivitas": "Bekerja",
  "Negara Tujuan": "UK",
  "Remardk": "Interested in MBA"
}
```

### Output (to Supabase)

```json
{
  "name": "John Doe",
  "phone": "+6281234567890",
  "email": "john@example.com",
  "workspace_id": "<eagle-workspace-uuid>",
  "lead_status": "prospect",
  "lead_score": 75,
  "metadata": {
    "source": "google_form",
    "metadata": {
      "form_answers": {
        "Level Bahasa Inggris": "Menengah",
        "Budget": "100-300jt",
        "Kapan Mau Berangkat": "3-6 bulan",
        "Aktivitas": "Bekerja",
        "Negara Tujuan": "UK",
        "Remardk": "Interested in MBA"
      }
    }
  }
}
```

---

## Lead Score Calculation (n8n Code Node)

```javascript
// Score calculation logic in n8n
function calculateScore(data) {
  let score = 0;

  // English Level (30 pts max)
  const english = data['Level Bahasa Inggris'];
  if (english === 'Mahir') score += 30;
  else if (english === 'Menengah') score += 20;
  else if (english === 'Pemula') score += 10;

  // Budget (25 pts max)
  const budget = data['Budget'];
  if (budget === '>500jt') score += 25;
  else if (budget === '300-500jt') score += 20;
  else if (budget === '100-300jt') score += 15;
  else score += 5;

  // Timeline (20 pts max)
  const timeline = data['Kapan Mau Berangkat'];
  if (timeline === '<3 bulan') score += 20;
  else if (timeline === '3-6 bulan') score += 15;
  else if (timeline === '6-12 bulan') score += 10;
  else score += 5;

  // Activity (15 pts max)
  const activity = data['Aktivitas'];
  if (activity === 'Bekerja') score += 15;
  else score += 10;

  // Target Country (10 pts max)
  const country = data['Negara Tujuan'];
  if (['UK', 'Australia', 'USA'].includes(country)) score += 10;
  else score += 5;

  return score;
}
```

---

## Supabase Table Structure

### contacts Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workspace_id | UUID | FK to workspaces |
| name | TEXT | Contact name |
| phone | TEXT | WhatsApp number |
| email | TEXT | Email address |
| lead_status | TEXT | prospect, contacted, qualified, etc |
| lead_score | INTEGER | 0-100 calculated score |
| metadata | JSONB | Form answers, source, merged data |
| tags | TEXT[] | Array of tags |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

### Metadata Structure

```json
{
  "source": "google_form",
  "metadata": {
    "form_answers": {
      "Level Bahasa Inggris": "Menengah",
      "Budget": "100-300jt",
      "Kapan Mau Berangkat": "3-6 bulan",
      "Aktivitas": "Bekerja",
      "Negara Tujuan": "UK",
      "Remardk": "Notes here"
    }
  },
  "merged_from": [],
  "merged_phone": []
}
```

---

## CRM Dashboard Features

### Inbox View

- Real-time WhatsApp messages
- Unread count badge
- Status filter (by lead status)
- Search by name/phone
- Mark as read on open

### Conversation View

- Message thread (inbound/outbound)
- Contact header with status badge
- AI/Human toggle button
- Quick reply templates
- Merge contacts option

### Database View

- All contacts table
- Sortable columns (name, score, status, date)
- Filter by status, tags
- Search functionality
- Contact detail sheet (slide-out)

### Contact Detail Sheet

- Basic info (name, phone, email)
- Lead score with breakdown
- Score breakdown by criteria:
  - English Level (30 pts)
  - Budget (25 pts)
  - Timeline (20 pts)
  - Activity (15 pts)
  - Target Country (10 pts)
- Tags management
- Activity timeline
- Notes section

### Settings

- Quick replies management (add/edit/delete)
- Workspace configuration
- Team members

---

## Troubleshooting

### Score Not Showing

**Cause:** CRM looking for fields in wrong location

**Solution:** CRM now checks:
1. `metadata[field]` (direct)
2. `metadata.metadata[field]` (nested)
3. `metadata.metadata.form_answers[field]` (deepest)

Maps Indonesian → English:
- 'Level Bahasa Inggris' → EnglishLevel
- 'Budget' → Budget
- 'Kapan Mau Berangkat' → Timeline
- 'Aktivitas' → Activity
- 'Negara Tujuan' → TargetCountry
- 'Remardk' → Remardk

### Duplicate Contacts

**Cause:** Same person, different phone numbers or form submissions

**Solution:** Use Merge Contacts feature in conversation view:
1. Open conversation
2. Click ⋮ menu → Merge Contact
3. Search for duplicate
4. Select and merge

---

## n8n Maintenance

### Start n8n Server

```bash
ssh 100.113.96.25
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false npx n8n start

# Background mode
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false nohup npx n8n start &
```

### Google Sheets Access

Service Account: `n8n-integration@gen-lang-client-0607995229.iam.gserviceaccount.com`

Share the Google Sheet with this email to grant access.

---

*Last updated: 2026-01-16*
