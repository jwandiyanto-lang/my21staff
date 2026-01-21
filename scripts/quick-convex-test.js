/**
 * Quick Convex Test
 *
 * Simple fetch-based test to see if Convex responds.
 * No CLI login needed - just fetch to HTTP endpoint.
 *
 * For full benchmark with statistics, run: tsx scripts/benchmark.ts
 */

const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  env.split("\n").forEach(function(line) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      // Remove quotes if present
      if (value && (value.startsWith('"') || value.startsWith("'"))) {
        process.env[key] = value.slice(1, -1);
      } else {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRM_API_KEY = process.env.CRM_API_KEY;

const TEST_WORKSPACE_ID = "25de3c4e-b9ca-4aff-9639-b35668f0a48e"; // Eagle
const TEST_PHONE = "6281234567890"; // Real phone from DB

async function run() {
  console.log("=== Quick Performance Test ===");
  console.log("");

  // 1. Test Supabase direct
  console.log("Test 1: Supabase direct query...");
  const start1 = Date.now();
  const select = "id,name,phone,lead_status,lead_score,tags,metadata,created_at";
  const url1 = SUPABASE_URL + "/rest/v1/contacts?workspace_id=eq." + TEST_WORKSPACE_ID + "&phone=eq." + TEST_PHONE + "&select=" + select;
  const resp1 = await fetch(url1, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json"
    }
  });
  const data1 = await resp1.json();
  const time1 = Date.now() - start1;

  console.log("  Found: " + (Array.isArray(data1) && data1.length > 0));
  console.log("  Time: " + time1 + "ms");
  console.log("");

  // 2. Test Convex via HTTP endpoint
  console.log("Test 2: Convex via HTTP endpoint...");
  try {
    const start2 = Date.now();
    const url2 = "https://intent-otter-212.convex.cloud/http/contacts/getByPhone?phone=" + TEST_PHONE + "&workspace_id=" + TEST_WORKSPACE_ID;
    const resp2 = await fetch(url2, {
      headers: { "x-api-key": CRM_API_KEY }
    });
    const text2 = await resp2.text();
    const time2 = Date.now() - start2;

    console.log("  Response status: " + resp2.status);
    console.log("  Response (first 200 chars):");
    console.log("  " + text2.substring(0, 200));
    console.log("");

    try {
      const data2 = JSON.parse(text2);
      console.log("  Found: " + (data2.found !== undefined ? data2.found : "?"));
      console.log("  Time: " + time2 + "ms");
      console.log("");

      console.log("=== Summary ===");
      console.log("Supabase direct: " + time1 + "ms");
      console.log("Convex HTTP:     " + time2 + "ms");

      const improvement = ((time1 - time2) / time1) * 100;
      var msg = improvement > 0 ? "faster" : "slower";
      console.log("");
      console.log("Convex is " + (improvement > 0 ? "" : "-") + improvement.toFixed(1) + "% " + msg);
      console.log("");
      console.log("Target: < 500ms");
      console.log("Supabase: " + (time1 < 500 ? "PASS" : "FAIL"));
      console.log("Convex:    " + (time2 < 500 ? "PASS" : "FAIL"));
    } catch (e) {
      console.log("  JSON parse error: " + e.message);
      console.log("  Raw response (first 500 chars): " + text2.substring(0, 500));
    }
  } catch (e) {
    console.log("  Error: " + e.message);
    console.log("");
    console.log("  Note: Convex schema not deployed yet.");
    console.log("  Run 'npx convex login' then 'npx convex deploy' in your terminal.");
  }

  // Real-time subscription test information
  console.log("");
  console.log("=== Real-time Subscription Test ===");
  console.log("");
  console.log("To test real-time subscription latency:");
  console.log("1. Open scripts/convex-realtime-test.html in your browser");
  console.log("2. Enter your CRM API key");
  console.log("3. Click 'Run Real-time Test'");
  console.log("4. Modify the contact in Convex dashboard");
  console.log("5. Observe the subscription update latency");
  console.log("");
  console.log("Expected: < 100ms latency from server change to client notification");
  console.log("Target: < 50ms P95 for real-time updates");
  console.log("");
  console.log("Note: Real-time subscriptions require Convex React client");
  console.log("      and cannot be tested from Node.js scripts.");
}

run().catch(console.error);
