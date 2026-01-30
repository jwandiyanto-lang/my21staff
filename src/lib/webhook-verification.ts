import crypto from 'crypto'

/**
 * Verify webhook signature using HMAC-SHA256 with timing-safe comparison.
 * Prevents timing attacks by using constant-time comparison.
 */
export function verifyWebhookSignature(
  payload: string | object,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  const payloadString = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload)

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    // Buffer mismatch (different lengths)
    return false
  }
}

/**
 * Generate HMAC-SHA256 signature for a payload.
 * Useful for testing or webhooks that require signing.
 */
export function generateSignature(payload: string | object, secret: string): string {
  const payloadString = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload)

  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex')
}
