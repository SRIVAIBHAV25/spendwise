import { Button, Text } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Rendered instead of the default button when provided. */
  className?: string;
  tone?: 'neutral' | 'danger';
}

/** Friendly placeholder used wherever a query can legitimately return nothing. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  tone = 'neutral',
}: EmptyStateProps) {
  const colors = useAppColors();
  const tint = tone === 'danger' ? colors.danger : colors.accent;

  return (
    <View className={cn('items-center justify-center px-8 py-10', className)}>
      <View
        className="h-16 w-16 items-center justify-center rounded-3xl"
        style={{ backgroundColor: withAlpha(tint, 0.14) }}
      >
        <Icon color={tint} size={28} />
      </View>
      <Text type="body" weight="semibold" align="center" className="mt-4">
        {title}
      </Text>
      {description ? (
        <Text type="body-sm" color="muted" align="center" className="mt-1.5">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-5" onPress={onAction} accessibilityLabel={actionLabel}>
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
