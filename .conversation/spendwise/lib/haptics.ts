/**
 * Thin haptics wrapper. Every call is a no-op on web and never throws, so
 * screens can fire feedback without guarding each call site.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tick for keypad presses and selection changes. */
export function tapFeedback(): void {
  if (!enabled) return;
  void Haptics.selectionAsync().catch(() => undefined);
}

/** Confirmation for a saved or completed action. */
export function successFeedback(): void {
  if (!enabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Used for validation problems and failed unlock attempts. */
export function errorFeedback(): void {
  if (!enabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}
