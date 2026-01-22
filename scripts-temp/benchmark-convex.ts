const CONVEX_URL = "https://intent-otter-212.convex.cloud";

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function calculateStats(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const p50 = sorted[Math.floor(count * 0.5)];
  const p95 = sorted[Math.floor(count * 0.95)];
  const p99 = sorted[Math.floor(count * 0.99)];
  const min = sorted[0];
  const max = sorted[count - 1];
  return { count, min, max, mean, p50, p95, p99 };
}

async function benchmarkApi(name, fn) {
  const start = Date.now();
  try {
    await fn();
    return Date.now() - start;
  } catch (error) {
    console.error(`  ${name}: ERROR - ${error}`);
    return -1;
  }
}

async function testGetRequest(path) {
  try {
    const response = await fetch(`${CONVEX_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`    Fetch error for ${path}: ${error}`);
    return null;
  }
}

async function testWebhookGet() {
  const response = await testGetRequest("/api/webhook/kapso?hub.challenge=test");
  if (response) {
    return Date.now() - Date.now();
  }
  return 0;
}

async function main() {
  console.log("============================================================");
  console.log("Convex API Performance Benchmark");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log("============================================================");
  console.log();

  const results = [];
  const webhookDurations = [];

  console.log("Testing: GET /api/webhook/kapso (50 iterations)");
  for (let i = 0; i < 50; i++) {
    const duration = await benchmarkApi("GET /webhook/kapso", testWebhookGet);
    if (duration >= 0) webhookDurations.push(duration);
    if ((i + 1) % 10 === 0) console.log(`  Completed ${i + 1}/50 iterations`);
  }
  const webhookStats = calculateStats(webhookDurations);
  results.push({ name: "GET /webhook/kapso", durations: webhookDurations });
  console.log();
  console.log(`  Min: ${formatDuration(webhookStats.min)}`);
  console.log(`  Max: ${formatDuration(webhookStats.max)}`);
  console.log(`  Mean: ${formatDuration(webhookStats.mean)}`);
  console.log(`  P50: ${formatDuration(webhookStats.p50)}`);
  console.log(`  P95: ${formatDuration(webhookStats.p95)} <-- KEY METRIC`);
  console.log(`  P99: ${formatDuration(webhookStats.p99)}`);
  console.log();

  const fs = require("fs");
  const outputFile = "/home/jfransisco/Desktop/21/my21staff/convex-test-results.txt";
  const output = [
    "# Convex API Performance Benchmark Results",
    "",
    `Date: ${new Date().toISOString()}`,
    `Convex URL: ${CONVEX_URL}`,
    "",
    "## Results Summary",
    "",
    `Target: P95 < 500ms`,
    `Result: ${webhookStats.p95 < 500 ? "PASS" : "FAIL"}`,
    "",
    "## Webhook Verification Endpoint (GET /webhook/kapso)",
    "",
    `Iterations: ${webhookStats.count}`,
    `Min: ${formatDuration(webhookStats.min)}`,
    `Max: ${formatDuration(webhookStats.max)}`,
    `Mean: ${formatDuration(webhookStats.mean)}`,
    `P50: ${formatDuration(webhookStats.p50)}`,
    `P95: ${formatDuration(webhookStats.p95)}`,
    `P99: ${formatDuration(webhookStats.p99)}`,
  ].join("\n");

  fs.writeFileSync(outputFile, output);

  console.log("============================================================");
  console.log("Benchmark Complete");
  console.log(`Results saved to: ${outputFile}`);
  console.log("============================================================");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
