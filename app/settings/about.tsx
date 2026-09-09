import Constants from 'expo-constants';
import { Text } from 'heroui-native';
import { Database, Info, ShieldCheck, WifiOff } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';

const POINTS = [
  {
    icon: Database,
    label: 'Stored on your device',
    description: 'Expenses live in a local database. Nothing is uploaded to a server.',
  },
  {
    icon: WifiOff,
    label: 'Works offline',
    description: 'No account and no internet connection needed to record or read your expenses.',
  },
  {
    icon: ShieldCheck,
    label: 'Private by default',
    description: 'Optional app lock keeps your PIN as a salted hash in the device keychain.',
  },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader title="About" backFallback="/(tabs)/settings" />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-5" showsVerticalScrollIndicator={false}>
        <View className="border-border bg-surface items-center rounded-3xl border p-6">
          <Text type="h4" weight="bold">
            Daily Expense Tracker
          </Text>
          <Text type="body-sm" color="muted" className="mt-1">
            {`Version ${version}`}
          </Text>
          <Text type="body-sm" color="muted" align="center" className="mt-3">
            A fast, private way to record everyday spending in seconds.
          </Text>
        </View>

        <SettingsCard title="Privacy">
          {POINTS.map((point, index) => (
            <View key={point.label}>
              {index > 0 ? <View className="bg-border h-px" /> : null}
              <SettingsRow icon={point.icon} label={point.label} description={point.description} />
            </View>
          ))}
        </SettingsCard>

        <SettingsCard title="Data">
          <SettingsRow
            icon={Info}
            label="Backups"
            description="Use Export to Excel to keep your own copy of the records."
          />
        </SettingsCard>
      </ScrollView>
    </View>
  );
}
