import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { getEnvelopes } from '@/services/envelopes';
import { colors, radius, spacing } from '@/theme';
import type { EnvelopeBalance } from '@/types/database';

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const formatPercentage = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

export default function EnvelopesScreen() {
  const [envelopes, setEnvelopes] = useState<EnvelopeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEnvelopes(await getEnvelopes());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen>
      <FlatList
        data={envelopes}
        keyExtractor={(item) => item.envelope_id}
        contentContainerStyle={{ gap: spacing.sm, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : undefined}
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No envelopes yet</Text>
              <Text style={styles.muted}>Create an envelope to start organizing your savings.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.nameGroup}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>{formatPercentage(item.percentage)}</Text>
                </View>
              </View>
              <Text style={styles.title}>{formatUsd(item.allocated_amount)}</Text>
            </View>
          </View>
        )}
      />
      <Button title="Add envelope" onPress={() => router.push('/add-envelope')} />
      <Button title="Manage Allocation" variant="secondary" onPress={() => router.push('/manage-rules')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  nameGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  badge: { backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeLabel: { fontSize: 12, fontWeight: '600', color: colors.primary },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  muted: { color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm },
});
