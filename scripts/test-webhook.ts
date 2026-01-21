/**
 * Test script for Kapso webhook HTTP action.
 *
 * Sends test POST requests to Convex webhook endpoint to verify
 * webhook processing and response handling.
 */

// Get CRM_API_KEY from environment or use placeholder
const CRM_API_KEY = process.env.CRM_API_KEY || "c2950f47951e03a9a291c0493b17c0780f8a185e560d86dd1ee7814d2cd8a5e6";
const CONVEX_WEBHOOK_URL = "https://intent-otter-212.convex.cloud/api/webhook/kapso";

/**
 * Sample Meta/WhatsApp webhook payload for testing
 */
const samplePayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "123456789",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "+6281234567890",
              phone_number_id: "test_phone_id",
            },
          },
        },
      ],
    },
  ],
};

/**
 * Test GET request (webhook verification endpoint)
 */
async function testWebhookGet() {
  console.log("\n=== Testing GET /webhook/kapso (verification endpoint) ===");

  try {
    const startTime = Date.now();
    const response = await fetch(`${CONVEX_WEBHOOK_URL}?hub.challenge=test_challenge`, {
      method: "GET",
    });
    const duration = Date.now() - startTime;
    const text = await response.text();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response: ${text}`);
    console.log(`GET test ${response.status === 200 ? "PASSED" : "FAILED"}`);

    return response.status === 200;
  } catch (error: any) {
    console.error(`GET test FAILED: ${error.message}`);
    return false;
  }
}

/**
 * Test POST request (webhook message endpoint)
 */
async function testWebhookPost() {
  console.log("\n=== Testing POST /webhook/kapso (message endpoint) ===");

  try {
    const startTime = Date.now();
    const response = await fetch(CONVEX_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CRM_API_KEY,
      },
      body: JSON.stringify(samplePayload),
    });
    const duration = Date.now() - startTime;
    const text = await response.text();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response: ${text}`);
    console.log(`POST test ${response.status === 200 ? "PASSED" : "FAILED"}`);

    if (response.status === 200) {
      try {
        const data = JSON.parse(text);
        console.log(`Received: ${data.received ?? false}`);
        console.log(`Scheduled: ${data.scheduled ?? 0} message(s)`);
      } catch {
        // Non-JSON response is fine
      }
    }

    return response.status === 200;
  } catch (error: any) {
    console.error(`POST test FAILED: ${error.message}`);
    return false;
  }
}

/**
 * Test POST without API key (should fail)
 */
async function testWebhookUnauthorized() {
  console.log("\n=== Testing POST /webhook/kapso without API key (should fail) ===");

  try {
    const startTime = Date.now();
    const response = await fetch(CONVEX_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(samplePayload),
    });
    const duration = Date.now() - startTime;
    const text = await response.text();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response: ${text}`);
    console.log(`Unauthorized test ${response.status === 401 ? "PASSED" : "FAILED"}`);

    return response.status === 401;
  } catch (error: any) {
    console.error(`Unauthorized test ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Kapso Webhook HTTP Action Tests");
  console.log(`Webhook URL: ${CONVEX_WEBHOOK_URL}`);
  console.log("=".repeat(60));

  const results = {
    get: await testWebhookGet(),
    post: await testWebhookPost(),
    unauthorized: await testWebhookUnauthorized(),
  };

  console.log("\n" + "=".repeat(60));
  console.log("Test Summary:");
  console.log("=".repeat(60));
  console.log(`GET (verification): ${results.get ? "PASS" : "FAIL"}`);
  console.log(`POST (with API key): ${results.post ? "PASS" : "FAIL"}`);
  console.log(`POST (unauthorized): ${results.unauthorized ? "PASS" : "FAIL"}`);
  console.log("=".repeat(60));

  const allPassed = results.get && results.post && results.unauthorized;
  console.log(`\nAll tests ${allPassed ? "PASSED" : "FAILED"}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
