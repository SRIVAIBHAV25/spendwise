import { View } from 'react-native';

import { ExpenseForm } from '@/components/ExpenseForm';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function NewExpenseScreen() {
  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Add expense"
        subtitle="Amount first, save in seconds"
        backFallback="/"
        backIcon="close"
      />
      <ExpenseForm />
    </View>
  );
}
