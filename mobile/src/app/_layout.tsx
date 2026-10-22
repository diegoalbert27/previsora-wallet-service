import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { ConnectionsProvider } from '@/providers/connections-provider';
import { theme } from '@/theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  // A font that fails to load must not block the app; text falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({ InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold });

  if (loading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg.app }}>
        <ActivityIndicator color={theme.colors.text.secondary} />
      </View>
    );
  }

  const signedIn = !!session;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg.app } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-connection" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-envelope" options={{ presentation: 'modal' }} />
        <Stack.Screen name="manage-rules" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ConnectionsProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ConnectionsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
