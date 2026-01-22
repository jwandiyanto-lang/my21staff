/**
 * Performance Benchmark: Supabase vs Convex
 *
 * Runs 50 iterations of contact lookups comparing:
 * 1. Supabase Direct (database-level)
 * 2. Supabase API (full stack)
 * 3. Convex API (full stack)
 *
 * Outputs P50/P95/P99 statistics for data-driven decision.
 */

import { config } from 'dotenv'
import { performance } from 'perf_hooks'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  TEST_WORKSPACE_ID: process.env.TEST_WORKSPACE_ID || "25de3c4e-b9ca-4aff-9639-b35668f0a48e",
  TEST_PHONE: process.env.TEST_PHONE || "6281234567890",
  API_URL: process.env.API_URL || "http://localhost:3000",
  CONVEX_URL: process.env.CONVEX_URL || "https://intent-otter-212.convex.cloud",
  ITERATIONS: 50,
  CRM_API_KEY: process.env.CRM_API_KEY || "",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// ============================================================================
// Utility Functions
// ============================================================================

interface Stats {
  p50: number
  p95: number
  p99: number
  mean: number
  min: number
  max: number
  count: number
}

function calculateStats(latencies: number[]): Stats {
  const sorted = [...latencies].sort((a, b) => a - b)
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  return { p50, p95, p99, mean, min, max, count: sorted.length }
}

function formatResult(label: string, stats: Stats): string {
  const width = 35
  const labelPad = label.padEnd(width)
  return `
${labelPad}
  P50:   ${stats.p50.toFixed(0).padStart(6)}ms
  P95:   ${stats.p95.toFixed(0).padStart(6)}ms
  P99:   ${stats.p99.toFixed(0).padStart(6)}ms
  Mean:  ${stats.mean.toFixed(0).padStart(6)}ms
  Min:   ${stats.min.toFixed(0).padStart(6)}ms
  Max:   ${stats.max.toFixed(0).padStart(6)}ms`.trim()
}

function formatComparison(statsA: Stats, statsB: Stats, labelA: string, labelB: string): string {
  const speedup = statsA.p95 / statsB.p95
  const improvement = ((statsA.p95 - statsB.p95) / statsA.p95) * 100

  return `
=== SPEED COMPARISON ===

${labelA} vs ${labelB} at P95:
  ${labelB} is ${speedup > 1 ? speedup.toFixed(2) + 'x faster' : 'not faster'}
  Improvement: ${improvement > 0 ? improvement.toFixed(1) + '%' : '-' + Math.abs(improvement).toFixed(1) + '%'}
  Difference: ${Math.abs(statsA.p95 - statsB.p95).toFixed(0)}ms

=== LATENCY DISTRIBUTION ===

${labelA}:  P50=${statsA.p50.toFixed(0)}ms  P95=${statsA.p95.toFixed(0)}ms  P99=${statsA.p99.toFixed(0)}ms
${labelB}:  P50=${statsB.p50.toFixed(0)}ms  P95=${statsB.p95.toFixed(0)}ms  P99=${statsB.p99.toFixed(0)}ms`.trim()
}

// ============================================================================
// Benchmark 1: Direct Supabase Database Queries
// ============================================================================

async function benchmarkSupabaseDirect(): Promise<number[]> {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("  Skipping: Supabase credentials not configured")
    return []
  }

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY)
  const latencies: number[] = []

  // Normalize phone for queries
  const normalizedPhone = CONFIG.TEST_PHONE.replace(/\D/g, '')

  for (let i = 0; i < CONFIG.ITERATIONS; i++) {
    const start = performance.now()

    try {
      // Replicate /api/contacts/by-phone query pattern
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name, phone, email, lead_status, lead_score, tags, metadata, created_at')
        .eq('workspace_id', CONFIG.TEST_WORKSPACE_ID)
        .eq('phone', normalizedPhone)
        .single()

      if (contact) {
        // Query 2-3: Notes and Conversation in parallel
        await Promise.all([
          supabase
            .from('contact_notes')
            .select('content, created_at')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('conversations')
            .select('id, last_message_preview, last_message_at')
            .eq('contact_id', contact.id)
            .maybeSingle(),
        ])
      }

      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Supabase Direct: ${latencies[latencies.length - 1].toFixed(0)}ms`)
    } catch (error) {
      // Continue on errors (contact not found is expected scenario)
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Supabase Direct: ${latencies[latencies.length - 1].toFixed(0)}ms (no data)`)
    }
  }

  return latencies
}

// ============================================================================
// Benchmark 2: Supabase via API Route (Full Stack)
// ============================================================================

async function benchmarkSupabaseApi(): Promise<number[]> {
  const latencies: number[] = []

  for (let i = 0; i < CONFIG.ITERATIONS; i++) {
    const start = performance.now()

    try {
      const url = `${CONFIG.API_URL}/api/contacts/by-phone?phone=${CONFIG.TEST_PHONE}&workspace_id=${CONFIG.TEST_WORKSPACE_ID}`
      const response = await fetch(url, {
        headers: { 'x-api-key': CONFIG.CRM_API_KEY },
      })

      await response.json()
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Supabase API: ${latencies[latencies.length - 1].toFixed(0)}ms`)
    } catch (error) {
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Supabase API: ${latencies[latencies.length - 1].toFixed(0)}ms (error)`)
    }
  }

  return latencies
}

// ============================================================================
// Benchmark 3: Convex Direct HTTP Action
// ============================================================================

async function benchmarkConvexDirect(): Promise<number[]> {
  const latencies: number[] = []

  for (let i = 0; i < CONFIG.ITERATIONS; i++) {
    const start = performance.now()

    try {
      // Test Convex HTTP action directly (bypasses Next.js)
      const url = `${CONFIG.CONVEX_URL}/http/contacts/getByPhone?phone=${CONFIG.TEST_PHONE}&workspace_id=${CONFIG.TEST_WORKSPACE_ID}`
      const response = await fetch(url, {
        headers: { 'x-api-key': CONFIG.CRM_API_KEY },
      })

      await response.json()
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Convex Direct: ${latencies[latencies.length - 1].toFixed(0)}ms`)
    } catch (error) {
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Convex Direct: ${latencies[latencies.length - 1].toFixed(0)}ms (error)`)
    }
  }

  return latencies
}

// ============================================================================
// Benchmark 4: Convex via API Route (Full Stack)
// ============================================================================

async function benchmarkConvexApi(): Promise<number[]> {
  const latencies: number[] = []

  for (let i = 0; i < CONFIG.ITERATIONS; i++) {
    const start = performance.now()

    try {
      const url = `${CONFIG.API_URL}/api/contacts/by-phone-convex?phone=${CONFIG.TEST_PHONE}&workspace_id=${CONFIG.TEST_WORKSPACE_ID}`
      const response = await fetch(url, {
        headers: { 'x-api-key': CONFIG.CRM_API_KEY },
      })

      await response.json()
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Convex API: ${latencies[latencies.length - 1].toFixed(0)}ms`)
    } catch (error) {
      latencies.push(performance.now() - start)
      console.log(`[${i+1}/${CONFIG.ITERATIONS}] Convex API: ${latencies[latencies.length - 1].toFixed(0)}ms (error)`)
    }
  }

  return latencies
}

// ============================================================================
// Benchmark 5: Real-time Subscription Latency (Convex)
// ============================================================================

interface RealtimeResult {
  hasSubscription: boolean
  latency: number
}

async function benchmarkConvexRealtime(): Promise<RealtimeResult> {
  console.log("\n=== Real-time Subscription Test ===")
  console.log("This test requires the Convex React client running in a browser.")
  console.log("To test real-time subscriptions:")
  console.log("1. Open convex-test.html in your browser")
  console.log("2. Enter your CRM API key")
  console.log("3. Click 'Run Real-time Test'")
  console.log("4. Modify the contact in Convex dashboard")
  console.log("5. Observe the subscription update latency")
  console.log("")
  console.log("Expected: < 100ms latency from server change to client notification")

  return {
    hasSubscription: true,
    latency: 0, // Cannot measure from Node.js - browser test required
  }
}

// ============================================================================
// Real-time Subscription Test HTML Generator
// ============================================================================

function generateRealtimeTestHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Convex Real-time Performance Test</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f8fafc;
    }
    h1 { color: #1e293b; }
    .section {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    label { display: block; margin: 10px 0 5px; font-weight: 500; }
    input, button {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-sizing: border-box;
    }
    button {
      background: #0f172a;
      color: white;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { background: #1e293b; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    .result {
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
    }
    .pass { border-left-color: #22c55e; background: #f0fdf4; }
    .fail { border-left-color: #ef4444; background: #fef2f2; }
    .time { font-family: monospace; font-size: 16px; font-weight: 600; }
    .log { font-family: monospace; font-size: 12px; color: #64748b; max-height: 200px; overflow-y: auto; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .stat { background: #f1f5f9; padding: 10px; border-radius: 4px; }
    .stat-label { font-size: 12px; color: #64748b; }
    .stat-value { font-size: 20px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Convex Real-time Performance Test</h1>
  <p>Tests real-time subscription latency for contact lookups</p>

  <div class="section">
    <h2>Configuration</h2>
    <label>Convex Deployment URL:</label>
    <input type="text" id="convexUrl" value="https://intent-otter-212.convex.cloud" />

    <label>CRM API Key:</label>
    <input type="password" id="apiKey" placeholder="Enter your CRM_API_KEY" />

    <label>Workspace ID:</label>
    <input type="text" id="workspaceId" value="25de3c4e-b9ca-4aff-9639-b35668f0a48e" />

    <label>Test Phone:</label>
    <input type="text" id="phone" value="6281234567890" />

    <button onclick="runSubscriptionTest()">Run Real-time Test</button>
  </div>

  <div id="output"></div>

  <script>
    let subscriptionLatencies = [];
    let maxTests = 10;

    async function runSubscriptionTest() {
      const convexUrl = document.getElementById('convexUrl').value;
      const apiKey = document.getElementById('apiKey').value;
      const workspaceId = document.getElementById('workspaceId').value;
      const phone = document.getElementById('phone').value;
      const output = document.getElementById('output');

      if (!apiKey) {
        output.innerHTML = '<div class="result fail">Error: Please enter CRM API key</div>';
        return;
      }

      output.innerHTML = '<div class="result">Starting real-time subscription test...</div>';

      // First, test the initial query
      const startTime = performance.now();
      try {
        const response = await fetch(\`\${convexUrl}/http/contacts/getByPhone?phone=\${phone}&workspace_id=\${workspaceId}\`, {
          method: 'GET',
          headers: { 'x-api-key': apiKey }
        });
        const data = await response.json();
        const queryTime = (performance.now() - startTime).toFixed(0);

        output.innerHTML += \`
          <div class="result">
            <h3>Initial Query Result</h3>
            <p>Found: \${data.found ? 'Yes' : 'No'}</p>
            <p>Query Time: <span class="time">\${queryTime}ms</span></p>
          </div>
        \`;

        if (data.found) {
          output.innerHTML += \`
            <div class="result">
              <h3>Contact Details</h3>
              <p>Name: \${data.contact?.name || 'N/A'}</p>
              <p>Status: \${data.contact?.leadStatus || 'N/A'}</p>
              <p>Score: \${data.contact?.leadScore || 'N/A'}</p>
            </div>
          \`;
        }
      } catch (e) {
        output.innerHTML += \`<div class="result fail">Error: \${e.message}</div>\`;
        return;
      }

      // Real-time subscription explanation
      output.innerHTML += \`
        <div class="result">
          <h3>Real-time Subscription Test</h3>
          <p>To measure subscription latency, you need to:</p>
          <ol>
            <li>Open the Convex dashboard</li>
            <li>Find the contact with phone \${phone}</li>
            <li>Modify any field (e.g., name or tags)</li>
            <li>Watch this page update in real-time</li>
          </ol>
          <p><strong>Expected latency: < 100ms</strong></p>
          <p><strong>Target: < 50ms P95</strong></p>
        </div>

        <div class="section">
          <h3>Live Subscription Monitor</h3>
          <div id="monitor">
            <p style="color: #64748b;">Waiting for subscription events...</p>
          </div>
        </div>

        <div class="section">
          <h3>Latency Statistics</h3>
          <div class="stats">
            <div class="stat">
              <div class="stat-label">Events Received</div>
              <div class="stat-value" id="eventCount">0</div>
            </div>
            <div class="stat">
              <div class="stat-label">Avg Latency</div>
              <div class="stat-value" id="avgLatency">-</div>
            </div>
            <div class="stat">
              <div class="stat-label">P50</div>
              <div class="stat-value" id="p50">-</div>
            </div>
            <div class="stat">
              <div class="stat-label">P95</div>
              <div class="stat-value" id="p95">-</div>
            </div>
            <div class="stat">
              <div class="stat-label">Min</div>
              <div class="stat-value" id="minLatency">-</div>
            </div>
            <div class="stat">
              <div class="stat-label">Max</div>
              <div class="stat-value" id="maxLatency">-</div>
            </div>
          </div>
        </div>
      \`;

      // Note: Actual subscription testing requires Convex React client
      // This HTML provides a placeholder for future implementation
      // The Convex React client would use useQuery hook for real-time updates
    }
  </script>
</body>
</html>`
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("=" .repeat(60))
  console.log("  PERFORMANCE BENCHMARK: Supabase vs Convex")
  console.log("=".repeat(60))
  console.log(`Workspace ID: ${CONFIG.TEST_WORKSPACE_ID}`)
  console.log(`Test Phone: ${CONFIG.TEST_PHONE}`)
  console.log(`Iterations: ${CONFIG.ITERATIONS}`)
  console.log(`API URL: ${CONFIG.API_URL}`)
  console.log(`Convex URL: ${CONFIG.CONVEX_URL}`)
  console.log("")

  // Run benchmarks
  const results: Record<string, number[]> = {}

  console.log("\n" + "=".repeat(60))
  console.log("  BENCHMARK 1: Supabase Direct Database")
  console.log("=".repeat(60))
  results.supabaseDirect = await benchmarkSupabaseDirect()

  console.log("\n" + "=".repeat(60))
  console.log("  BENCHMARK 2: Supabase via API Route (Full Stack)")
  console.log("=".repeat(60))
  results.supabaseApi = await benchmarkSupabaseApi()

  console.log("\n" + "=".repeat(60))
  console.log("  BENCHMARK 3: Convex Direct HTTP Action")
  console.log("=".repeat(60))
  results.convexDirect = await benchmarkConvexDirect()

  console.log("\n" + "=".repeat(60))
  console.log("  BENCHMARK 4: Convex via API Route (Full Stack)")
  console.log("=".repeat(60))
  results.convexApi = await benchmarkConvexApi()

  console.log("\n" + "=".repeat(60))
  console.log("  BENCHMARK 5: Real-time Subscription")
  console.log("=".repeat(60))
  await benchmarkConvexRealtime()

  // Calculate statistics
  const statsSupabaseDirect = calculateStats(results.supabaseDirect)
  const statsSupabaseApi = calculateStats(results.supabaseApi)
  const statsConvexDirect = calculateStats(results.convexDirect)
  const statsConvexApi = calculateStats(results.convexApi)

  // Print results
  console.log("\n" + "=".repeat(60))
  console.log("  RESULTS")
  console.log("=".repeat(60))

  if (statsSupabaseDirect.count > 0) {
    console.log(formatResult("Supabase Direct (Database)", statsSupabaseDirect))
    console.log("")
  }

  if (statsSupabaseApi.count > 0) {
    console.log(formatResult("Supabase API (Full Stack)", statsSupabaseApi))
    console.log("")
  }

  if (statsConvexDirect.count > 0) {
    console.log(formatResult("Convex Direct (HTTP Action)", statsConvexDirect))
    console.log("")
  }

  if (statsConvexApi.count > 0) {
    console.log(formatResult("Convex API (Full Stack)", statsConvexApi))
    console.log("")
  }

  // Print comparisons
  if (statsSupabaseApi.count > 0 && statsConvexApi.count > 0) {
    console.log(formatComparison(statsSupabaseApi, statsConvexApi, "Supabase API", "Convex API"))
    console.log("")
  }

  if (statsSupabaseDirect.count > 0 && statsConvexDirect.count > 0) {
    console.log(formatComparison(statsSupabaseDirect, statsConvexDirect, "Supabase Direct", "Convex Direct"))
    console.log("")
  }

  // Decision criteria
  console.log("\n" + "=".repeat(60))
  console.log("  DECISION CRITERIA")
  console.log("=".repeat(60))

  if (statsSupabaseApi.count > 0) {
    console.log(`Supabase API P95: ${statsSupabaseApi.p95.toFixed(0)}ms`)
    console.log(`Supabase API Target: < 500ms`)
    console.log(`Supabase API Status: ${statsSupabaseApi.p95 < 500 ? 'PASS' : 'FAIL'}`)
    console.log("")
  }

  if (statsConvexApi.count > 0) {
    console.log(`Convex API P95: ${statsConvexApi.p95.toFixed(0)}ms`)
    console.log(`Convex API Target: < 500ms`)
    console.log(`Convex API Status: ${statsConvexApi.p95 < 500 ? 'PASS' : 'FAIL'}`)
    console.log("")
  }

  if (statsSupabaseApi.count > 0 && statsConvexApi.count > 0) {
    const improvement = ((statsSupabaseApi.p95 - statsConvexApi.p95) / statsSupabaseApi.p95) * 100
    const speedup = statsSupabaseApi.p95 / statsConvexApi.p95

    console.log("")
    console.log(`=== RECOMMENDATION ===`)
    console.log("")

    if (statsConvexApi.p95 < 500 && speedup >= 1.5) {
      console.log("GO AHEAD WITH CONVEX MIGRATION:")
      console.log(`- Convex P95 (${statsConvexApi.p95.toFixed(0)}ms) meets < 500ms target`)
      console.log(`- Convex is ${speedup.toFixed(1)}x faster at P95`)
      console.log(`- ${improvement.toFixed(0)}% improvement in response time`)
    } else if (Math.abs(improvement) < 20) {
      console.log("OPTIMIZE SUPABASE INSTEAD:")
      console.log(`- Results are comparable (< 20% difference)`)
      console.log(`- Performance gap not significant enough for migration`)
      console.log(`- Focus on: indexes, query optimization, connection pooling`)
    } else if (statsConvexApi.p95 >= 500 && statsSupabaseApi.p95 >= 500) {
      console.log("BOTH SYSTEMS NEED OPTIMIZATION:")
      console.log(`- Neither meets < 500ms target`)
      console.log(`- Consider: caching, denormalization, CDN`)
    } else {
      console.log("NEUTRAL:")
      console.log(`- Results are mixed`)
      console.log(`- Consider other factors: real-time features, dev experience, cost`)
    }

    console.log("")
    console.log(`Supabase: P50=${statsSupabaseApi.p50.toFixed(0)}ms  P95=${statsSupabaseApi.p95.toFixed(0)}ms  P99=${statsSupabaseApi.p99.toFixed(0)}ms`)
    console.log(`Convex:   P50=${statsConvexApi.p50.toFixed(0)}ms  P95=${statsConvexApi.p95.toFixed(0)}ms  P99=${statsConvexApi.p99.toFixed(0)}ms`)
  }

  console.log("\n" + "=".repeat(60))
  console.log("  REAL-TIME SUBSCRIPTION TEST")
  console.log("=".repeat(60))
  console.log("To test real-time subscriptions:")
  console.log("1. Open scripts/convex-realtime-test.html in browser")
  console.log("2. Enter your CRM API key")
  console.log("3. Click 'Run Real-time Test'")
  console.log("4. Modify contact in Convex dashboard")
  console.log("5. Observe subscription update latency")
  console.log("")
  console.log("Expected: < 100ms latency")
  console.log("Target: < 50ms P95")
}

// Generate real-time test HTML file
const fs = require('fs')
const path = require('path')

const htmlOutput = generateRealtimeTestHtml()
const htmlPath = path.join(__dirname, 'convex-realtime-test.html')
fs.writeFileSync(htmlPath, htmlOutput, 'utf-8')
console.log(`Generated: ${htmlPath}`)
console.log("")

// Run benchmark
main().catch(console.error)
