import CryptoJS from 'crypto-js';

const SALT_LENGTH = 16;

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

/**
 * Hash PIN with salt using PBKDF2
 */
export function hashPin(pin: string, salt: string): string {
  return CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
}

/**
 * Verify PIN against hash
 */
export function verifyPin(pin: string, hash: string, salt: string): boolean {
  const computedHash = hashPin(pin, salt);
  return computedHash === hash;
}

/**
 * Encrypt data with PIN
 */
export function encryptData(data: string, pin: string): string {
  return CryptoJS.AES.encrypt(data, pin).toString();
}

/**
 * Decrypt data with PIN
 */
export function decryptData(encryptedData: string, pin: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a secure ID
 */
export function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}
