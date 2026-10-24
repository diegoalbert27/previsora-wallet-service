import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

const BAR_HEIGHT = 60;
const ICON_BOOST = 3;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.bg.app },
        tabBarActiveTintColor: theme.colors.text.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.surface1,
          borderTopColor: theme.colors.border.subtle,
          borderTopWidth: 1,
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: theme.space[2],
          paddingBottom: Math.max(insets.bottom, theme.space[2]),
        },
        tabBarLabelStyle: { fontFamily: theme.typography.microButton.fontFamily, fontSize: 12, marginTop: 2 },
      }}>
      <Tabs.Screen
        name="balances"
        options={{
          title: 'Balances',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size + ICON_BOOST} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="envelopes"
        options={{
          title: 'Envelopes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size + ICON_BOOST} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'link' : 'link-outline'} size={size + ICON_BOOST} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
