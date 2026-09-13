import { Text } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
  className?: string;
}

/** Title row used above lists and report blocks. */
export function SectionHeader({
  title,
  caption,
  actionLabel,
  onAction,
  right,
  className,
}: SectionHeaderProps) {
  const colors = useAppColors();

  return (
    <View className={cn('flex-row items-end justify-between gap-3', className)}>
      <View className="flex-1">
        <Text type="body" weight="semibold">
          {title}
        </Text>
        {caption ? (
          <Text type="body-xs" color="muted">
            {caption}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          className="min-h-11 flex-row items-center justify-center gap-0.5"
        >
          <Text type="body-sm" weight="medium" className="text-accent">
            {actionLabel}
          </Text>
          <ChevronRight color={colors.accent} size={16} />
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}
