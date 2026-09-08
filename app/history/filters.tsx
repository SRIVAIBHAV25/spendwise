import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function FiltersScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Filters" backFallback="/history" backIcon="close" />
    </View>
  );
}
