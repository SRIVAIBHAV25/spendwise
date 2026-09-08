import { randomUUID } from 'expo-crypto';

/** Stable unique id for locally created records. */
export function newId(): string {
  return randomUUID();
}
