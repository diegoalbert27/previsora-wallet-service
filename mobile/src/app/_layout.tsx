import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { ConnectionsProvider } from '@/providers/connections-provider';

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const signedIn = !!session;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-connection" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-envelope" options={{ presentation: 'modal' }} />
        <Stack.Screen name="manage-rules" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConnectionsProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </ConnectionsProvider>
    </AuthProvider>
  );
}
