import 'react-native-url-polyfill/auto';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { getAccessToken, setUnauthorizedHandler } from '../lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const bootstrap = async () => {
      const token = await getAccessToken();
      router.replace(token ? '/(tabs)' : '/(auth)/index');
      await SplashScreen.hideAsync();
    };
    bootstrap();

    setUnauthorizedHandler(() => {
      router.replace('/(auth)/index' as any);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#F8FAFF" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
