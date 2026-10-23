import Constants from 'expo-constants';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Avatar } from '@/components/ui/Avatar';
import { useProfile } from '@/hooks/use-profile';
import { displayName } from '@/lib/user-name';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { theme } from '@/theme';

const PROVIDER_LABELS: Record<string, string> = {
  email: 'Email and password',
  google: 'Google',
};

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const profile = useProfile();
  const user = session?.user;

  const name = { firstName: profile?.first_name, lastName: profile?.last_name, email: user?.email };
  const provider = String(user?.app_metadata?.provider ?? 'email');
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to sign in again to see your balances.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Profile</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => router.back()} style={styles.close}>
          <X size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Avatar {...name} size={88} />
          <Text style={styles.fullName}>{displayName(name)}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Section title="Account">
          <InfoRow label="Name" value={displayName({ ...name, email: null }) || '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Sign-in method" value={PROVIDER_LABELS[provider] ?? provider} />
          <InfoRow label="Member since" value={memberSince} last />
        </Section>

        <Section title="About the app">
          <InfoRow label="App" value={Constants.expoConfig?.name ?? 'Previsora Wallet'} />
          <InfoRow label="Version" value={Constants.expoConfig?.version ?? '—'} last />
        </Section>
      </ScrollView>

      <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { ...theme.typography.titleScreen, color: theme.colors.text.primary },
  close: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: theme.space[6], paddingBottom: theme.space[4] },
  identity: { alignItems: 'center', gap: theme.space[1], paddingVertical: theme.space[4] },
  fullName: { ...theme.typography.titleGreeting, color: theme.colors.text.primary, marginTop: theme.space[3] },
  email: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },
  section: { gap: theme.space[2] },
  sectionTitle: { ...theme.typography.label, color: theme.colors.text.secondary, paddingHorizontal: theme.space[1] },
  card: {
    backgroundColor: theme.colors.bg.surface1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingHorizontal: theme.space[4],
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[4], paddingVertical: 14 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border.default },
  rowLabel: { ...theme.typography.body, color: theme.colors.text.secondary },
  rowValue: { ...theme.typography.bodyStrong, color: theme.colors.text.primary, flexShrink: 1, textAlign: 'right' },
});
