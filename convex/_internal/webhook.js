import { httpRouter } from "convex/server";
import { httpAction } from "../_generated/server.js";
import { api } from "../_generated/api.js";

const http = httpRouter();

http.route({
  path: "/webhook/kapso",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const challenge = url.searchParams.get("hub.challenge");
    if (challenge) {
      console.log("[Kapso Webhook] Verification challenge received");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Kapso webhook endpoint ready", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

export const router = http;
