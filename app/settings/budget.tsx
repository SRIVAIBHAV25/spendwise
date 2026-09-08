import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function BudgetSettingsScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Monthly budget" backFallback="/(tabs)/settings" />
    </View>
  );
}
