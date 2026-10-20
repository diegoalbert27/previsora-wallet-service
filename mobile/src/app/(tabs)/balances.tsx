import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { useBalances } from '@/hooks/use-balances';
import { useSync } from '@/hooks/use-sync';
import { useConnections } from '@/providers/connections-provider';
import { colors, radius, spacing } from '@/theme';

const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

// Splits the total so the decimals can be rendered smaller than the integer part.
function splitTotal(n: number): { whole: string; fraction: string } {
  const parts = new Intl.NumberFormat(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).formatToParts(n);
  const decimalIndex = parts.findIndex((p) => p.type === 'decimal');
  const join = (items: Intl.NumberFormatPart[]) => items.map((p) => p.value).join('');
  return decimalIndex === -1
    ? { whole: join(parts), fraction: '' }
    : { whole: join(parts.slice(0, decimalIndex)), fraction: join(parts.slice(decimalIndex)) };
}

export default function BalancesScreen() {
  const { assetTotals, total, lastSyncedAt, loading, error, refresh } = useBalances();
  const { connections, loading: connectionsLoading } = useConnections();
  const { sync, syncing, lastResult, error: syncError } = useSync();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function syncAndReload() {
    await sync();
    await refresh();
  }

  const totalParts = splitTotal(total);
  const hasConnections = connections.length > 0;
  const needsConnection = !connectionsLoading && !hasConnections;
  const problems = [syncError, ...(lastResult?.errors.map((e) => e.error) ?? [])].filter(Boolean) as string[];

  return (
    <Screen>
      <FlatList
        data={assetTotals}
        keyExtractor={(item) => item.asset}
        contentContainerStyle={{ gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={syncAndReload} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {needsConnection ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Connect your first account</Text>
                <Text style={styles.muted}>
                  Add a wallet or an exchange and we will sync your balances right away.
                </Text>
                <Button title="Add connection" onPress={() => router.push('/add-connection')} />
              </View>
            ) : (
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total balance</Text>
              <Text style={styles.totalValue}>
                ≈ ${totalParts.whole}
                <Text style={styles.totalFraction}>{totalParts.fraction}</Text>
              </Text>
              <Text style={styles.totalMeta}>
                {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : 'Not synced yet'}
              </Text>
            </View>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {problems.map((message, i) => (
              <Text key={i} style={styles.error}>
                {message}
              </Text>
            ))}
            {hasConnections ? <Text style={styles.sectionTitle}>By asset</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading || !hasConnections ? undefined : (
            <Text style={styles.muted}>No balances yet. Pull down to sync your connections.</Text>
          )
        }
        renderItem={({ item }) => {
          const open = expanded === item.asset;
          return (
            <Pressable style={styles.card} onPress={() => setExpanded(open ? null : item.asset)}>
              <View style={styles.row}>
                <Text style={styles.asset}>{item.asset}</Text>
                <Text style={styles.asset}>{formatAmount(item.amount)}</Text>
              </View>
              {open &&
                item.byConnection.map((share) => (
                  <View key={share.connectionId} style={styles.row}>
                    <Text style={styles.muted}>{share.label}</Text>
                    <Text style={styles.muted}>{formatAmount(share.amount)}</Text>
                  </View>
                ))}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, marginBottom: spacing.sm },
  totalCard: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  totalLabel: { color: colors.primaryText, opacity: 0.85, fontSize: 14 },
  totalValue: { color: colors.primaryText, fontSize: 32, fontWeight: '700' },
  totalFraction: { fontSize: 16, fontWeight: '500', opacity: 0.85 },
  totalMeta: { color: colors.primaryText, opacity: 0.85, fontSize: 12 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  asset: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { color: colors.textMuted, flexShrink: 1 },
  error: { color: colors.danger, fontSize: 14 },
});
