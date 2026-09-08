/**
 * App lock primitives: a salted SHA-256 PIN stored in SecureStore (never in
 * plain text) and device biometrics through expo-local-authentication.
 *
 * Web has no SecureStore, so the browser preview falls back to AsyncStorage.
 * The hash-only storage model means the fallback still never keeps the PIN.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const HASH_KEY = 'expense-tracker.pin.hash';
const SALT_KEY = 'expense-tracker.pin.salt';

export const PIN_LENGTH = 4;

const useSecureStore = Platform.OS === 'ios' || Platform.OS === 'android';

async function readItem(key: string): Promise<string | null> {
  if (useSecureStore) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function writeItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

function randomSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export async function hasPin(): Promise<boolean> {
  const [hash, salt] = await Promise.all([readItem(HASH_KEY), readItem(SALT_KEY)]);
  return Boolean(hash && salt);
}

export async function savePin(pin: string): Promise<void> {
  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  await Promise.all([writeItem(SALT_KEY, salt), writeItem(HASH_KEY, hash)]);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const [hash, salt] = await Promise.all([readItem(HASH_KEY), readItem(SALT_KEY)]);
  if (!hash || !salt) return false;
  return (await hashPin(pin, salt)) === hash;
}

export async function clearPin(): Promise<void> {
  await Promise.all([deleteItem(HASH_KEY), deleteItem(SALT_KEY)]);
}

export interface BiometricSupport {
  /** Device has biometric hardware. */
  available: boolean;
  /** Hardware exists and the user has enrolled a fingerprint or face. */
  enrolled: boolean;
  /** Human label such as "Face ID", "Touch ID" or "Fingerprint". */
  label: string;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (!useSecureStore) return { available: false, enrolled: false, label: 'Biometrics' };
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const isFace = types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION as number,
    );
    const isFingerprint = types.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT as number,
    );
    let label = 'Biometrics';
    if (Platform.OS === 'ios') label = isFace ? 'Face ID' : 'Touch ID';
    else if (isFace) label = 'Face unlock';
    else if (isFingerprint) label = 'Fingerprint';
    return { available: hasHardware, enrolled: hasHardware && enrolled, label };
  } catch {
    return { available: false, enrolled: false, label: 'Biometrics' };
  }
}

export interface BiometricResult {
  success: boolean;
  /** Human readable reason, only set when `success` is false. */
  message?: string;
}

export async function authenticateWithBiometrics(reason: string): Promise<BiometricResult> {
  if (!useSecureStore) return { success: false, message: 'Biometrics are not available here.' };
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
      cancelLabel: 'Use PIN',
    });
    if (result.success) return { success: true };
    return { success: false, message: 'Biometric check did not pass. Enter your PIN instead.' };
  } catch {
    return { success: false, message: 'Biometrics are unavailable right now. Use your PIN.' };
  }
}
