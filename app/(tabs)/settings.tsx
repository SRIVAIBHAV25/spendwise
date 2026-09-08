import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Settings" />
    </View>
  );
}
