# Performance Baseline

**Captured:** [DATE - to be filled after 24-48 hours of production traffic]
**Environment:** Production (https://my21staff.com)
**Traffic sample:** [XX hours, ~XXX requests]

## Web Vitals (from Vercel Speed Insights)

| Metric | P50 | P75 | P95 | P99 | Target |
|--------|-----|-----|-----|-----|--------|
| LCP | - | - | - | - | <2.5s |
| INP | - | - | - | - | <200ms |
| CLS | - | - | - | - | <0.1 |
| FCP | - | - | - | - | <1.8s |
| TTFB | - | - | - | - | <800ms |

## API Response Times

### /api/contacts/by-phone
| Percentile | Response Time | Query Count |
|------------|---------------|-------------|
| P50 | -ms | - queries |
| P95 | -ms | - queries |
| P99 | -ms | - queries |

**Query breakdown (typical):**
- contacts: -ms
- contact_notes: -ms
- conversations: -ms
- messages: -ms

### /api/conversations
| Percentile | Response Time | Query Count |
|------------|---------------|-------------|
| P50 | -ms | - queries |
| P95 | -ms | - queries |
| P99 | -ms | - queries |

**Query breakdown (typical):**
- conversations: -ms
- activeCount: -ms
- teamMembers: -ms
- contactsWithTags: -ms

## Observations

- [ ] Observation 1
- [ ] Observation 2
- [ ] Observation 3

## Baseline Captured

- [ ] Speed Insights enabled and collecting (check dashboard)
- [ ] API logs showing timing data (check Vercel logs)
- [ ] Sufficient traffic sample (24-48 hours)
- [ ] Metrics filled in above tables

## Next Steps

Based on this baseline, proceed to Phase 2: Supabase Optimization.

---
*Template created: 2026-01-21*
*Baseline captured: [DATE - TBD]*
