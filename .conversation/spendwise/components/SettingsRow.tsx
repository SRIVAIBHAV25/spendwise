import { Text } from 'heroui-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  /** Trailing content such as a Switch; replaces the chevron. */
  right?: ReactNode;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  className?: string;
}

/** One row inside a settings card: icon, label, optional value and chevron. */
export function SettingsRow({
  label,
  description,
  icon: Icon,
  iconColor,
  right,
  value,
  onPress,
  tone = 'default',
  className,
}: SettingsRowProps) {
  const colors = useAppColors();
  const tint = tone === 'danger' ? colors.danger : (iconColor ?? colors.accent);

  const content = (
    <>
      {Icon ? (
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: withAlpha(tint, 0.14) }}
        >
          <Icon color={tint} size={19} />
        </View>
      ) : null}

      <View className="flex-1">
        <Text
          type="body"
          weight="medium"
          style={tone === 'danger' ? { color: colors.danger } : undefined}
        >
          {label}
        </Text>
        {description ? (
          <Text type="body-xs" color="muted" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text type="body-sm" color="muted" numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {right ?? (onPress ? <ChevronRight color={colors.muted} size={18} /> : null)}
    </>
  );

  if (!onPress) {
    return (
      <View className={cn('flex-row items-center gap-3 px-4 py-3.5', className)}>{content}</View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, value, description].filter(Boolean).join(', ')}
      className={cn(
        'active:bg-surface-secondary flex-row items-center gap-3 px-4 py-3.5',
        className,
      )}
    >
      {content}
    </Pressable>
  );
}

interface SettingsCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Groups settings rows into a titled card with hairline separators. */
export function SettingsCard({ title, children, className }: SettingsCardProps) {
  return (
    <View className={cn('gap-2', className)}>
      {title ? (
        <Text type="body-xs" color="muted" weight="medium" className="px-1 uppercase">
          {title}
        </Text>
      ) : null}
      <View className="border-border bg-surface overflow-hidden rounded-3xl border">
        {children}
      </View>
    </View>
  );
}
