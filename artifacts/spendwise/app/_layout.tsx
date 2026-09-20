// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Platform, View } from 'react-native';
import { useEffect } from 'react';
import { HeroUINativeProvider } from 'heroui-native';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { InstallPrompt } from '@/components/InstallPrompt';
import { LockGate } from '@/components/LockGate';
import { ToastHost } from '@/components/ToastHost';
import { useTransactionsStore } from '@/lib/stores/transactions';
import { useAppColors, useThemeSync } from '@/lib/theme';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (Bilt preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useThemeSync();
  const colors = useAppColors();
  const initStorage = useTransactionsStore((state) => state.init);

  useEffect(() => {
    void initStorage();
  }, [initStorage]);

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Report uncaught JS errors and unhandled promise rejections to parent (Bilt preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);



  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // The web preview loads Inter through the CSS link above. Native builds still
  // wait for the bundled font assets so they never flash with a fallback font.
  if (Platform.OS !== 'web' && !loaded && !error) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <LockGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="expense/new"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="expense/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="history/index" />
            <Stack.Screen name="history/filters" options={{ presentation: 'modal' }} />
            <Stack.Screen name="day/[dayKey]" />
            <Stack.Screen name="settings/security" />
            <Stack.Screen name="settings/budget" />
            <Stack.Screen name="settings/categories" />
            <Stack.Screen name="settings/export" />
            <Stack.Screen name="settings/about" />
          </Stack>
        </LockGate>
        <ToastHost />
        <InstallPrompt />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
