import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function ExportSettingsScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Export to Excel" backFallback="/(tabs)/settings" />
    </View>
  );
}
