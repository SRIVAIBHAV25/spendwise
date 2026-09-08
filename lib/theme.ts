/**
 * Appearance wiring plus a React Native parseable color palette.
 *
 * `className` styling always goes through the Uniwind/HeroUI semantic tokens in
 * `global.css`. These hex values mirror those tokens for the places that need a
 * plain color value instead: icon props, chart fills, the tab bar, the status
 * bar and native modal backgrounds (oklch strings are not parseable there).
 */
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';

import { useSettingsStore } from '@/lib/stores/settings';

export type ResolvedTheme = 'light' | 'dark';

export interface AppColors {
  background: string;
  foreground: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  muted: string;
  border: string;
  separator: string;
  accent: string;
  accentForeground: string;
  success: string;
  warning: string;
  danger: string;
}

export const PALETTES: Record<ResolvedTheme, AppColors> = {
  light: {
    background: '#F2F6F5',
    foreground: '#1D212A',
    surface: '#FFFFFF',
    surfaceSecondary: '#EDF2F1',
    surfaceTertiary: '#E6ECEB',
    muted: '#6C7280',
    border: '#DBDFE6',
    separator: '#D2D7DF',
    accent: '#0F9488',
    accentForeground: '#FFFFFF',
    success: '#17A559',
    warning: '#E08A0C',
    danger: '#E2413A',
  },
  dark: {
    background: '#12151B',
    foreground: '#F7F8FA',
    surface: '#1C1F26',
    surfaceSecondary: '#23262E',
    surfaceTertiary: '#292D36',
    muted: '#9AA1AF',
    border: '#2C3038',
    separator: '#3B404A',
    accent: '#2CC3AE',
    accentForeground: '#08201C',
    success: '#35C97C',
    warning: '#EDA83C',
    danger: '#F1564B',
  },
};

/** The theme actually on screen, honouring the "System" appearance option. */
export function useResolvedTheme(): ResolvedTheme {
  const scheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  if (themeMode === 'system') return scheme === 'dark' ? 'dark' : 'light';
  return themeMode;
}

export function useAppColors(): AppColors {
  return PALETTES[useResolvedTheme()];
}

/** Keeps Uniwind's active theme in sync with the stored appearance preference. */
export function useThemeSync(): ResolvedTheme {
  const resolved = useResolvedTheme();
  useEffect(() => {
    Uniwind.setTheme(resolved);
  }, [resolved]);
  return resolved;
}

/** Adds an alpha channel to a `#rrggbb` color; other formats pass through. */
export function withAlpha(color: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const clamped = Math.min(1, Math.max(0, alpha));
  return `${color}${Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
