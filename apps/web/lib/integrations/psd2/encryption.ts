/**
 * Token Encryption Utilities for PSD2
 *
 * Uses AES-256-GCM to encrypt/decrypt OAuth tokens before storing
 * them in the database. The encryption key is stored in the
 * PSD2_ENCRYPTION_KEY environment variable.
 *
 * IMPORTANT: In production, consider using a dedicated secrets manager
 * (e.g. HashiCorp Vault, AWS KMS, Google Cloud KMS) instead of
 * a static env var. This simple approach is suitable for getting started.
 *
 * The PSD2_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).
 * Generate one with: openssl rand -hex 32
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.PSD2_ENCRYPTION_KEY
  if (!key) {
    throw new Error(
      'PSD2_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32'
    )
  }
  if (key.length !== 64) {
    throw new Error(
      'PSD2_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32'
    )
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a plaintext string (e.g. an OAuth access or refresh token).
 * Returns a base64 string containing IV + auth tag + ciphertext.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Pack as: IV (16 bytes) + authTag (16 bytes) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted])
  return packed.toString('base64')
}

/**
 * Decrypt a token that was encrypted with encryptToken().
 */
export function decryptToken(encryptedBase64: string): string {
  const key = getEncryptionKey()
  const packed = Buffer.from(encryptedBase64, 'base64')

  // Unpack
  const iv = packed.subarray(0, IV_LENGTH)
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
