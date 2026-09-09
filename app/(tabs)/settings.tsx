import { router } from 'expo-router';
import { Switch, Text } from 'heroui-native';
import {
  CircleHelp,
  FileSpreadsheet,
  Info,
  Lock,
  Moon,
  Shapes,
  SmartphoneNfc,
  Sun,
  SunMoon,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SelectionCard } from '@/components/SelectionCard';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/lib/stores/settings';
import { showToast } from '@/lib/stores/toast';
import { useTransactionsStore } from '@/lib/stores/transactions';
import { useAppColors } from '@/lib/theme';
import type { ThemeMode } from '@/lib/types';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: SunMoon },
];

export default function SettingsScreen() {
  const colors = useAppColors();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const budgetEnabled = useSettingsStore((state) => state.budgetEnabled);
  const budgetAmount = useSettingsStore((state) => state.budgetAmount);
  const categories = useSettingsStore((state) => state.categories);
  const showEmptyUpiTypes = useSettingsStore((state) => state.showEmptyUpiTypes);
  const setShowEmptyUpiTypes = useSettingsStore((state) => state.setShowEmptyUpiTypes);
  const clearAllTransactions = useTransactionsStore((state) => state.clearAllTransactions);

  const [isClearOpen, setIsClearOpen] = useState(false);

  const onClearData = async () => {
    try {
      await clearAllTransactions();
      showToast('All transaction data cleared');
    } catch {
      showToast('Could not clear your data. Please try again.', 'error');
    }
  };

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text type="body-xs" color="muted" weight="medium" className="px-1 uppercase">
            Appearance
          </Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((option) => (
              <SelectionCard
                key={option.mode}
                label={option.label}
                icon={option.icon}
                className="flex-1"
                selected={themeMode === option.mode}
                onPress={() => setThemeMode(option.mode)}
              />
            ))}
          </View>
        </View>

        <SettingsCard title="Security">
          <SettingsRow
            icon={Lock}
            label="App Lock"
            description="PIN and biometric unlock"
            value={appLockEnabled ? 'On' : 'Off'}
            onPress={() => router.push('/settings/security')}
          />
        </SettingsCard>

        <SettingsCard title="Budget">
          <SettingsRow
            icon={Wallet}
            label="Monthly Budget"
            description="Optional spending limit with alerts"
            value={budgetEnabled ? formatCurrency(budgetAmount) : 'Off'}
            onPress={() => router.push('/settings/budget')}
          />
        </SettingsCard>

        <SettingsCard title="Categories">
          <SettingsRow
            icon={Shapes}
            label="Manage categories"
            description="Add, rename or remove categories"
            value={`${categories.length}`}
            onPress={() => router.push('/settings/categories')}
          />
        </SettingsCard>

        <SettingsCard title="Reports">
          <SettingsRow
            icon={SmartphoneNfc}
            label="Show empty UPI types"
            description="Keep unused UPI apps in the breakdown"
            right={
              <Switch isSelected={showEmptyUpiTypes} onSelectedChange={setShowEmptyUpiTypes}>
                <Switch.Thumb />
              </Switch>
            }
          />
        </SettingsCard>

        <SettingsCard title="Export">
          <SettingsRow
            icon={FileSpreadsheet}
            label="Export to Excel"
            description="Share an .xlsx sheet of your expenses"
            onPress={() => router.push('/settings/export')}
          />
        </SettingsCard>

        <SettingsCard title="Data">
          <SettingsRow
            icon={Trash2}
            label="Clear all transaction data"
            description="Deletes every saved expense from this device"
            tone="danger"
            onPress={() => setIsClearOpen(true)}
          />
        </SettingsCard>

        <SettingsCard title="About">
          <SettingsRow
            icon={Info}
            label="About this app"
            description="Version and privacy information"
            onPress={() => router.push('/settings/about')}
          />
        </SettingsCard>

        <View className="flex-row items-center gap-2 px-1">
          <CircleHelp color={colors.muted} size={14} />
          <Text type="body-xs" color="muted" className="flex-1">
            Everything you record stays on this device. No account or internet connection needed.
          </Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={isClearOpen}
        title="Clear all transaction data?"
        description="Every saved expense will be removed from this device. Your settings, categories and budget stay as they are."
        confirmLabel="Clear data"
        onOpenChange={setIsClearOpen}
        onConfirm={() => {
          void onClearData();
        }}
      />
    </View>
  );
}
