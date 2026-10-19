import { useFonts } from 'expo-font';
import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DiagnosticProvider } from '../services/diagnostic/DiagnosticContext';
import { Theme } from '../theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const MinimalWhiteTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Theme.colors.background,
    card: Theme.colors.surface,
    text: Theme.colors.textPrimary,
    border: Theme.colors.surfaceBorder,
    primary: Theme.colors.primary,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <DiagnosticProvider>
      <ThemeProvider value={MinimalWhiteTheme}>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Diagnostic Protocol Info',
              headerStyle: { backgroundColor: Theme.colors.surface },
              headerTintColor: Theme.colors.textPrimary,
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </DiagnosticProvider>
  );
}
