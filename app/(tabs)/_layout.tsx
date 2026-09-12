import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CalendarDays, ChartPie, House, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

import { AddExpenseFab } from '@/components/AddExpenseFab';
import { useAppColors, useResolvedTheme, withAlpha } from '@/lib/theme';

export default function TabLayout() {
  const theme = useResolvedTheme();
  const colors = useAppColors();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.separator,
            borderTopWidth: 1,
            elevation: 0,
            shadowColor: withAlpha(colors.foreground, 0.12),
            shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
            shadowRadius: 12,
            height: Platform.OS === 'ios' ? 90 : 68,
            paddingTop: 8,
            overflow: 'visible',
          },
          tabBarItemStyle: { overflow: 'visible' },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <House color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarButton: () => <AddExpenseFab />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => <ChartPie color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
