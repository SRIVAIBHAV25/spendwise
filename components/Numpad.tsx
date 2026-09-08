import { Text } from 'heroui-native';
import { Delete } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type NumpadKey = string;

interface NumpadProps {
  /** Receives '0'-'9', '.' or 'backspace'. */
  onKeyPress: (key: NumpadKey) => void;
  /** Long-pressing backspace clears the whole value. */
  onClear?: () => void;
  showDecimal?: boolean;
  className?: string;
}

interface KeyButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  height: number;
  children: ReactNode;
}

function KeyButton({ onPress, onLongPress, accessibilityLabel, height, children }: KeyButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 130 });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-1 p-1"
      style={{ minWidth: 0 }}
    >
      <AnimatedView
        className="items-center justify-center rounded-2xl border border-border bg-surface"
        style={[animatedStyle, { height }]}
      >
        {children}
      </AnimatedView>
    </Pressable>
  );
}

/**
 * Large custom numeric keypad. Used for the amount field and the PIN screen so
 * the system keyboard never opens for numbers.
 */
export function Numpad({ onKeyPress, onClear, showDecimal = true, className }: NumpadProps) {
  const colors = useAppColors();
  const { height: windowHeight } = useWindowDimensions();
  const keyHeight = windowHeight < 700 ? 52 : windowHeight < 820 ? 58 : 64;

  const rows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showDecimal ? '.' : '', '0', 'backspace'],
  ];

  return (
    <View className={cn('w-full', className)}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row">
          {row.map((key, keyIndex) => {
            if (!key) {
              return <View key={`spacer-${keyIndex}`} className="flex-1 p-1" />;
            }

            if (key === 'backspace') {
              return (
                <KeyButton
                  key={key}
                  height={keyHeight}
                  accessibilityLabel="Delete last digit"
                  onPress={() => {
                    tapFeedback();
                    onKeyPress('backspace');
                  }}
                  onLongPress={
                    onClear
                      ? () => {
                          tapFeedback();
                          onClear();
                        }
                      : undefined
                  }
                >
                  <Delete color={colors.foreground} size={22} />
                </KeyButton>
              );
            }

            return (
              <KeyButton
                key={key}
                height={keyHeight}
                accessibilityLabel={key === '.' ? 'Decimal point' : key}
                onPress={() => {
                  tapFeedback();
                  onKeyPress(key);
                }}
              >
                <Text type="h4" weight="semibold">
                  {key}
                </Text>
              </KeyButton>
            );
          })}
        </View>
      ))}
    </View>
  );
}
