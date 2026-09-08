import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function CalendarScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Calendar" />
    </View>
  );
}
