/**
 * Seed catalog: default categories, payment types, UPI providers and the icon
 * registry used to render them. Colors are chosen to read well on both light
 * and dark surfaces and are used for icon chips plus chart series.
 */
import {
  Baby,
  Banknote,
  BookOpen,
  Bus,
  Car,
  Circle,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  type LucideIcon,
  MoreHorizontal,
  Music,
  PawPrint,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
} from 'lucide-react-native';

import type { Category, PaymentType, UpiType } from '@/lib/types';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  car: Car,
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCap,
  receipt: Receipt,
  film: Film,
  'heart-pulse': HeartPulse,
  'shopping-cart': ShoppingCart,
  coffee: Coffee,
  house: House,
  plane: Plane,
  dumbbell: Dumbbell,
  gift: Gift,
  wifi: Wifi,
  smartphone: Smartphone,
  fuel: Fuel,
  'paw-print': PawPrint,
  'book-open': BookOpen,
  baby: Baby,
  shirt: Shirt,
  wrench: Wrench,
  music: Music,
  wallet: Wallet,
  more: MoreHorizontal,
};

/** Icons offered when creating or editing a custom category. */
export const ICON_CHOICES: string[] = Object.keys(CATEGORY_ICONS);

/** Color swatches offered when creating or editing a custom category. */
export const COLOR_CHOICES: string[] = [
  '#F97316',
  '#0EA5E9',
  '#A855F7',
  '#6366F1',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
  '#22C55E',
  '#F59E0B',
  '#64748B',
];

export function getCategoryIcon(icon: string | undefined): LucideIcon {
  return (icon && CATEGORY_ICONS[icon]) || Circle;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: 'utensils', color: '#F97316', isDefault: true },
  { id: 'travel', name: 'Travel', icon: 'bus', color: '#0EA5E9', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#A855F7', isDefault: true },
  {
    id: 'education',
    name: 'Education',
    icon: 'graduation-cap',
    color: '#6366F1',
    isDefault: true,
  },
  { id: 'bills', name: 'Bills', icon: 'receipt', color: '#EF4444', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#EC4899', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#14B8A6', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', color: '#22C55E', isDefault: true },
  { id: 'other', name: 'Other', icon: 'more', color: '#64748B', isDefault: true },
];

export const PAYMENT_META: Record<PaymentType, { icon: LucideIcon; color: string }> = {
  Cash: { icon: Banknote, color: '#22C55E' },
  UPI: { icon: Smartphone, color: '#6366F1' },
  Card: { icon: CreditCard, color: '#F59E0B' },
  'Bank Transfer': { icon: Landmark, color: '#0EA5E9' },
  Other: { icon: Wallet, color: '#64748B' },
};

export const UPI_META: Record<UpiType, { color: string }> = {
  GPay: { color: '#4285F4' },
  PhonePe: { color: '#7C3AED' },
  Paytm: { color: '#0EA5E9' },
  BHIM: { color: '#F97316' },
  Other: { color: '#64748B' },
};

/** Fallback color for categories that were deleted but still have transactions. */
export const UNKNOWN_CATEGORY_COLOR = '#94A3B8';
