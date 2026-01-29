// Quick script to check message directions in database
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkMessages() {
  try {
    // Get recent messages
    const result = await client.query("messages:listRecent", {
      limit: 20
    });

    console.log("\n=== Recent Messages ===\n");
    result.forEach(msg => {
      console.log(`Direction: ${msg.direction} | Content: ${msg.content?.substring(0, 30)} | Kapso ID: ${msg.kapso_message_id}`);
    });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkMessages();
