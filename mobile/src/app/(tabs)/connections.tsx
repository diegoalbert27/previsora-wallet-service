import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { connectionLabel } from '@/hooks/use-balances';
import { supabase } from '@/lib/supabase';
import { useConnections } from '@/providers/connections-provider';
import { deleteConnection } from '@/services/connections';
import { colors, radius, spacing } from '@/theme';
import type { Connection } from '@/types/database';

export default function ConnectionsScreen() {
  const { connections, refresh } = useConnections();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function confirmDelete(connection: Connection) {
    Alert.alert(
      'Delete connection',
      `${connectionLabel(connection)} and its synced balances will be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(connection.id);
            try {
              await deleteConnection(connection.id);
              // Deleting the last connection sends the user back to onboarding via the navigation guard.
              await refresh();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.muted}>No connections yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.title}>{connectionLabel(item)}</Text>
              <Text style={styles.muted}>{item.connection_type === 'CEX' ? 'Exchange' : 'On-chain wallet'}</Text>
            </View>
            <Pressable
              accessibilityLabel="Delete connection"
              disabled={deletingId === item.id}
              onPress={() => confirmDelete(item)}
              style={({ pressed }) => [styles.delete, (pressed || deletingId === item.id) && styles.pressed]}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteLabel}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
      <Button title="Add connection" onPress={() => router.push('/add-connection')} />
      <Button title="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  info: { flex: 1, gap: spacing.xs },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { color: colors.textMuted },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
  },
  deleteLabel: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.4 },
});
