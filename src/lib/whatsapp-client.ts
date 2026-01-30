// WhatsApp client wrapper for Kapso API integration

import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

interface WhatsAppClientConfig {
  kapsoApiKey: string;
  phoneNumberId: string;
}

/**
 * Creates a configured WhatsApp client for Kapso API
 */
export function createWhatsAppClient(config: WhatsAppClientConfig): WhatsAppClient {
  return new WhatsAppClient({
    baseUrl: "https://api.kapso.ai/meta/whatsapp",
    kapsoApiKey: config.kapsoApiKey,
  });
}

/**
 * Gets WhatsApp credentials from workspace settings
 * In dev mode, returns mock credentials
 */
export async function getWhatsAppConfig(workspaceId: string) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  if (isDevMode) {
    return {
      kapsoApiKey: 'mock-api-key',
      phoneNumberId: 'mock-phone-id',
    }
  }

  // In production, fetch from Convex workspace settings
  // This will be implemented when workspace settings table exists
  throw new Error('Production WhatsApp config not yet implemented')
}
