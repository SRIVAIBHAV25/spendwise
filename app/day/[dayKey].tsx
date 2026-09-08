import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function DayScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Day" backFallback="/(tabs)/calendar" />
    </View>
  );
}
