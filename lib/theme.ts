/**
 * Appearance wiring plus a React Native parseable color palette.
 *
 * `className` styling always goes through the Uniwind/HeroUI semantic tokens in
 * `global.css`. These hex values mirror those tokens for the places that need a
 * plain color value instead: icon props, chart fills, the tab bar, the status
 * bar and native modal backgrounds.
 */
import { useEffect } from 'react';
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
    background: '#F4F4F4',
    foreground: '#111111',
    surface: '#FFFFFF',
    surfaceSecondary: '#EEEEEE',
    surfaceTertiary: '#E3E3E3',
    muted: '#595959',
    border: '#DCDCDC',
    separator: '#CFCFCF',
    accent: '#171717',
    accentForeground: '#FFFFFF',
    hero: '#111111',
    heroForeground: '#FFFFFF',
    heroBorder: '#111111',
    success: '#1C8A4F',
    warning: '#A76A10',
    danger: '#C2352C',
  },
  dark: {
    background: '#000000',
    foreground: '#FAFAFA',
    surface: '#141414',
    surfaceSecondary: '#1F1F1F',
    surfaceTertiary: '#2B2B2B',
    muted: '#B3B3B3',
    border: '#333333',
    separator: '#3D3D3D',
    accent: '#FAFAFA',
    accentForeground: '#0A0A0A',
    hero: '#171717',
    heroForeground: '#FAFAFA',
    heroBorder: '#333333',
    success: '#4AC07D',
    warning: '#E5AA48',
    danger: '#F0655A',
  },
};

/** The theme actually on screen. Appearance is an explicit light/dark choice. */
export function useResolvedTheme(): ResolvedTheme {
  const themeMode = useSettingsStore((state) => state.themeMode);
  return themeMode === 'dark' ? 'dark' : 'light';
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
