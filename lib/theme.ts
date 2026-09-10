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
  /** Background of the large statement cards (month total, day total). */
  hero: string;
  /** Content color used on top of `hero`. */
  heroForeground: string;
  /** Hairline used to lift `hero` off the background in dark mode. */
  heroBorder: string;
  success: string;
  warning: string;
  danger: string;
}

export const PALETTES: Record<ResolvedTheme, AppColors> = {
  light: {
    background: '#F5F5F5',
    foreground: '#121212',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F0F0',
    surfaceTertiary: '#E6E6E6',
    muted: '#757575',
    border: '#E1E1E1',
    separator: '#D4D4D4',
    accent: '#171717',
    accentForeground: '#FFFFFF',
    hero: '#111111',
    heroForeground: '#FFFFFF',
    heroBorder: '#111111',
    success: '#1D9A5B',
    warning: '#C97A12',
    danger: '#D93A32',
  },
  dark: {
    background: '#000000',
    foreground: '#FAFAFA',
    surface: '#0F0F0F',
    surfaceSecondary: '#1A1A1A',
    surfaceTertiary: '#242424',
    muted: '#9E9E9E',
    border: '#292929',
    separator: '#363636',
    accent: '#FAFAFA',
    accentForeground: '#0A0A0A',
    hero: '#141414',
    heroForeground: '#FAFAFA',
    heroBorder: '#2E2E2E',
    success: '#3ECF8E',
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
