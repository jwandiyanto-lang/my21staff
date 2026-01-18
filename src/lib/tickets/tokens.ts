import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.TICKET_TOKEN_SECRET || process.env.ENCRYPTION_KEY

/**
 * Generate HMAC-signed reopen token with 7-day expiry
 */
export function generateReopenToken(ticketId: string, requesterId: string): string {
  if (!SECRET) {
    throw new Error('TICKET_TOKEN_SECRET or ENCRYPTION_KEY required for reopen tokens')
  }

  const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  const payload = `${ticketId}:${requesterId}:${expiry}`
  const signature = createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')

  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

/**
 * Verify reopen token and extract ticket/requester IDs
 * Returns null if token is invalid or expired
 */
export function verifyReopenToken(token: string): { ticketId: string; requesterId: string } | null {
  if (!SECRET) return null

  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')

    if (parts.length !== 4) return null

    const [ticketId, requesterId, expiryStr, signature] = parts

    // Check expiry
    const expiry = parseInt(expiryStr, 10)
    if (Date.now() > expiry) return null

    // Verify signature
    const payload = `${ticketId}:${requesterId}:${expiryStr}`
    const expected = createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex')

    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

    return { ticketId, requesterId }
  } catch {
    return null
  }
}
