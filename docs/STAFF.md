# AI Staff - my21staff

8 AI specialists that execute routine operations 24/7. They handle the follow-ups, reminders, and reports — so humans can focus on complex decisions.

> **AI handles the routine. Humans handle the complex.**

---

## Staff Directory

### Accounting (Coral #E85D4C)
| Name | Role | Value |
|------|------|-------|
| Budi | Bookkeeper | Record, categorize, and reconcile all transactions |
| Sari | Financial Reporter | Generate P&L, cash flow, and monthly reports |

### Marketing (Blue #3B82F6)
| Name | Role | Value |
|------|------|-------|
| Rian | Content Marketing | Plan, create, and track content performance |
| Maya | Ads Manager | Setup, optimize, and report on Meta/Google ads |

### Customer Success (Green #10B981)
| Name | Role | Value |
|------|------|-------|
| Dewi | Customer Support | Handle inquiries, complaints, and feedback loops |
| Adi | Sales Follow-up | Nurture leads, send reminders, close deals |

### Tech Support (Dark #1F2937)
| Name | Role | Value |
|------|------|-------|
| Fajar | Product Helper | Guide users through my21staff features |
| Putri | Integration Support | Connect WhatsApp, CRM, and third-party tools |

---

## Avatar Design Prompt

Use this prompt with AI image generators (Midjourney, DALL-E, etc.) to create Notion-style avatars:

```
A minimalist, black-and-white flat vector illustration portrait of [CHARACTER NAME],
rendered in the expressive "Notion avatar" art style.

LINE WORK & VIBE:
- Style: Use THICK, UNIFORM black outlines (monoline weight). The lines should feel
  organic, smooth, and confident, not rigidly geometric or robotic like generic icons.
- Vibe: The character should have a distinct personality and a relaxed, cool, or
  friendly expression. Focus on stylized features, unique hairstyles, and defining
  accessories to convey character.

SELECTIVE BLACK FILLS (CRITICAL):
- Unlike pure outline icons, utilize Solid Black Fills selectively and strategically.
- Where to Fill: Use solid black for prominent hair masses, beards, eyebrows,
  sunglasses, or dark clothing elements.
- Where to Keep White: The skin, main face area, and lighter elements must remain
  pure flat white inside the thick outlines.

COMPOSITION & TECHNICAL:
- No shading, no gray tones, no gradients. Only pure Black and pure White.
- Clean bust or headshot composition centered on a white background.
- High contrast, clean 2D vector graphics.
```

### Character Descriptions for Each Staff

| Staff | Character Description |
|-------|----------------------|
| Budi (Bookkeeper) | Indonesian male, clean-shaven, professional collar shirt, friendly smile |
| Sari (Financial Reporter) | Indonesian female, long hair, professional look, warm expression |
| Rian (Content Marketing) | Indonesian male, beard with headband, creative/modern look |
| Maya (Ads Manager) | Indonesian female, short modern hair, earrings, confident smile |
| Dewi (Customer Support) | Indonesian female, hijab, warm and welcoming expression |
| Adi (Sales Follow-up) | Indonesian male, styled hair, casual shirt, big friendly smile |
| Fajar (Product Helper) | Indonesian male, formal suit with tie, professional neutral expression |
| Putri (Integration Support) | Indonesian female, ponytail, tech-savvy look, friendly smile |

---

## Implementation

Staff cards are implemented in:
- `src/components/ui/staff-cards.tsx` - Card component with wave animations
- `src/app/page.tsx` - Landing page integration

Each card features:
- Canvas-based wave animation (Interface Craft style)
- SVG Notion-style avatar
- Department color coding
- Role and description
- 3D tilt hover effect

---

*Last updated: 2026-01-14*
