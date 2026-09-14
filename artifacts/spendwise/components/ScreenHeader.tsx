import { type Href } from 'expo-router';
import { Text } from 'heroui-native';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { goBackOrReplace } from '@/lib/navigation';
import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back/close control. The fallback route is used when the screen was opened directly. */
  backFallback?: Href;
  backIcon?: 'chevron' | 'close';
  right?: ReactNode;
  className?: string;
}

/** Shared in-screen header. Native headers stay hidden so spacing is consistent. */
export function ScreenHeader({
  title,
  subtitle,
  backFallback,
  backIcon = 'chevron',
  right,
  className,
}: ScreenHeaderProps) {
  const colors = useAppColors();
  const Icon = backIcon === 'close' ? X : ChevronLeft;

  return (
    <View
      className={cn('flex-row items-center gap-3 px-5 pt-1 pb-3', className)}
      style={Platform.OS === 'web' ? { paddingTop: 67 } : undefined}
    >
      {backFallback ? (
        <Pressable
          onPress={() => goBackOrReplace(backFallback)}
          accessibilityRole="button"
          accessibilityLabel={backIcon === 'close' ? 'Close' : 'Go back'}
          hitSlop={8}
          className="active:bg-surface-secondary -ml-2 h-11 w-11 items-center justify-center rounded-full"
        >
          <Icon color={colors.foreground} size={24} />
        </Pressable>
      ) : null}

      <View className="flex-1">
        <Text type="h4" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text type="body-sm" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}
