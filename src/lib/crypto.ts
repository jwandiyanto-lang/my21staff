import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }
  // Key should be 32 bytes (256 bits) - hash it to ensure correct length
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns format: iv:authTag:encrypted (all hex encoded)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return iv:authTag:encrypted (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a string looks like our encrypted format (iv:authTag:encrypted)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false
  const parts = text.split(':')
  // Our format: 32 char iv (16 bytes hex) : 32 char authTag (16 bytes hex) : encrypted data
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2 && parts[1].length === 32
}

/**
 * Safely encrypt - returns original text if ENCRYPTION_KEY not set
 * Use this for graceful degradation in development
 */
export function safeEncrypt(text: string): string {
  try {
    return encrypt(text)
  } catch (error) {
    if ((error as Error).message.includes('ENCRYPTION_KEY')) {
      console.warn('[Crypto] ENCRYPTION_KEY not set - storing unencrypted')
      return text
    }
    throw error
  }
}

/**
 * Safely decrypt - returns original text if not encrypted or ENCRYPTION_KEY not set
 */
export function safeDecrypt(text: string): string {
  if (!isEncrypted(text)) {
    return text // Not encrypted, return as-is
  }
  try {
    return decrypt(text)
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error)
    throw new Error('Failed to decrypt sensitive data')
  }
}
