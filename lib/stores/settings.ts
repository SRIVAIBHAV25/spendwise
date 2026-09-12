/**
 * Persisted user preferences: appearance, categories, optional budget,
 * security toggles and report options. Transaction data never lives here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CATEGORIES } from '@/lib/catalog';
import { newId } from '@/lib/id';
import type { BudgetThreshold, Category, ThemeMode } from '@/lib/types';

interface SettingsState {
  hydrated: boolean;
  themeMode: ThemeMode;
  categories: Category[];
  budgetEnabled: boolean;
  budgetAmount: number;
  thresholds: BudgetThreshold[];
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  showEmptyUpiTypes: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setBudgetEnabled: (enabled: boolean) => void;
  setBudgetAmount: (amount: number) => void;
  toggleThreshold: (threshold: BudgetThreshold) => void;
  addCategory: (input: { name: string; icon: string; color: string }) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  removeCategory: (id: string) => void;
  resetCategories: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setShowEmptyUpiTypes: (show: boolean) => void;
  markHydrated: () => void;
}

function isPartialSettingsState(value: unknown): value is Partial<SettingsState> {
  return typeof value === 'object' && value !== null;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      themeMode: 'light',
      categories: DEFAULT_CATEGORIES,
      budgetEnabled: false,
      budgetAmount: 15000,
      thresholds: [75, 90, 100],
      appLockEnabled: false,
      biometricEnabled: false,
      showEmptyUpiTypes: false,

      setThemeMode: (themeMode) => set({ themeMode }),
      setBudgetEnabled: (budgetEnabled) => set({ budgetEnabled }),
      setBudgetAmount: (budgetAmount) => set({ budgetAmount: Math.max(0, budgetAmount) }),
      toggleThreshold: (threshold) =>
        set((state) => ({
          thresholds: state.thresholds.includes(threshold)
            ? state.thresholds.filter((value) => value !== threshold)
            : [...state.thresholds, threshold].sort((a, b) => a - b),
        })),
      addCategory: ({ name, icon, color }) =>
        set((state) => ({
          categories: [...state.categories, { id: newId(), name: name.trim(), icon, color }],
        })),
      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id
              ? { ...category, ...patch, name: (patch.name ?? category.name).trim() }
              : category,
          ),
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        })),
      resetCategories: () => set({ categories: DEFAULT_CATEGORIES }),
      setAppLockEnabled: (appLockEnabled) =>
        set(appLockEnabled ? { appLockEnabled } : { appLockEnabled, biometricEnabled: false }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setShowEmptyUpiTypes: (showEmptyUpiTypes) => set({ showEmptyUpiTypes }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'expense-tracker/settings/v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      version: 2,
      // v1 stored a 'system' appearance option; appearance is now light/dark only.
      migrate: (persisted) => {
        if (!isPartialSettingsState(persisted)) return persisted;
        if (persisted.themeMode !== 'dark') return { ...persisted, themeMode: 'light' };
        return persisted;
      },
      // Runs once persisted preferences are merged, so gates do not flash.
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export function categoryByName(categories: Category[], name: string): Category | undefined {
  return categories.find((category) => category.name === name);
}
