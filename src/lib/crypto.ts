/**
 * Cryptographic utilities for secure PIN storage
 * Uses Web Crypto API (PBKDF2) to hash PINs before storage
 */

const SALT_LENGTH = 16;
const ITERATIONS = 100000; // OWASP recommended minimum
const HASH_LENGTH = 32;

/**
 * Generate a random salt for PBKDF2
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert Uint8Array to base64 string for storage
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string back to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a PIN using PBKDF2
 * @param pin - The plaintext PIN (4 digits)
 * @param salt - Optional salt (if verifying), otherwise generates new salt
 * @returns Object containing base64-encoded hash and salt
 */
export async function hashPin(
  pin: string,
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits');
  }

  const usedSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  // Import the PIN as a key
  const key = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive the hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: usedSalt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_LENGTH * 8
  );

  return {
    hash: arrayBufferToBase64(hashBuffer),
    salt: arrayBufferToBase64(usedSalt),
  };
}

/**
 * Verify a PIN against a stored hash
 * @param pin - The plaintext PIN to verify
 * @param storedHash - The stored base64-encoded hash
 * @param storedSalt - The stored base64-encoded salt
 * @returns true if PIN matches, false otherwise
 */
export async function verifyPin(
  pin: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const salt = base64ToArrayBuffer(storedSalt);
    const { hash } = await hashPin(pin, salt);
    return hash === storedHash;
  } catch {
    return false;
  }
}

/**
 * Generate a secure random PIN (for testing/development)
 */
export function generateSecurePin(): string {
  const array = new Uint8Array(1);
  let pin = '';
  while (pin.length < 4) {
    crypto.getRandomValues(array);
    const digit = array[0] % 10;
    pin += digit.toString();
  }
  return pin;
}
