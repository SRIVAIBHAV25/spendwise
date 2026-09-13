/**
 * Tiny global toast used for the subtle confirmations after saving, updating,
 * deleting or exporting. Kept independent of navigation so a message survives
 * the screen dismiss that follows a save.
 */
import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

interface ToastState {
  message: string | null;
  tone: ToastTone;
  /** Bumped on every show so the host can restart its auto-hide timer. */
  token: number;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  token: 0,
  show: (message, tone = 'success') => set((state) => ({ message, tone, token: state.token + 1 })),
  hide: () => set({ message: null }),
}));

export function showToast(message: string, tone: ToastTone = 'success'): void {
  useToastStore.getState().show(message, tone);
}
