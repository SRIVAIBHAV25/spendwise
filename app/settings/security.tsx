import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function SecuritySettingsScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Security" backFallback="/(tabs)/settings" />
    </View>
  );
}
