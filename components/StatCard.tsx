import { Text } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  icon?: LucideIcon;
  /** Icon chip color; defaults to the accent color. */
  iconColor?: string;
  className?: string;
}

/** Compact metric tile used on the dashboard and in reports. */
export function StatCard({ label, value, caption, icon: Icon, iconColor, className }: StatCardProps) {
  const colors = useAppColors();
  const tint = iconColor ?? colors.accent;

  return (
    <View
      className={cn('flex-1 rounded-3xl border border-border bg-surface p-4', className)}
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}
    >
      {Icon ? (
        <View
          className="mb-3 h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: withAlpha(tint, 0.14) }}
        >
          <Icon color={tint} size={18} />
        </View>
      ) : null}
      <Text type="body-xs" color="muted" numberOfLines={1}>
        {label}
      </Text>
      <Text type="h5" weight="semibold" className="mt-0.5" numberOfLines={1}>
        {value}
      </Text>
      {caption ? (
        <Text type="body-xs" color="muted" className="mt-0.5" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
