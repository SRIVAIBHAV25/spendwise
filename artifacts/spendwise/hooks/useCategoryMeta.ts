/**
 * Resolves a stored category name to its icon and color. Transactions keep the
 * category name, so deleted categories still render with a neutral fallback.
 */
import type { LucideIcon } from 'lucide-react-native';
import { useCallback } from 'react';

import { getCategoryIcon, UNKNOWN_CATEGORY_COLOR } from '@/lib/catalog';
import { useSettingsStore } from '@/lib/stores/settings';

export interface CategoryMeta {
  name: string;
  icon: LucideIcon;
  color: string;
  /** False when the category was removed in Settings. */
  exists: boolean;
}

export type CategoryMetaResolver = (name: string) => CategoryMeta;

export function useCategoryMeta(): CategoryMetaResolver {
  const categories = useSettingsStore((state) => state.categories);

  return useCallback(
    (name: string): CategoryMeta => {
      const match = categories.find((category) => category.name === name);
      return {
        name,
        icon: getCategoryIcon(match?.icon),
        color: match?.color ?? UNKNOWN_CATEGORY_COLOR,
        exists: Boolean(match),
      };
    },
    [categories],
  );
}
