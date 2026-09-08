import { View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';

export default function EditExpenseScreen() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Edit expense" backFallback="/" backIcon="close" />
    </View>
  );
}
