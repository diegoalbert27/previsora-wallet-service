import { router } from 'expo-router';
import { Link, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { AssetRow } from '@/components/ui/AssetRow';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { HeroBalanceCard } from '@/components/ui/HeroBalanceCard';
import { ProfileHeader } from '@/components/ui/ProfileHeader';
import { useBalances } from '@/hooks/use-balances';
import { useSync } from '@/hooks/use-sync';
import { useConnections } from '@/providers/connections-provider';
import { theme } from '@/theme';

const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

export default function BalancesScreen() {
  const { assetTotals, total, totalAllocated, lastSyncedAt, loading, error, refresh } = useBalances();
  const { connections, loading: connectionsLoading } = useConnections();
  const { sync, syncing, lastResult, error: syncError } = useSync();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function syncAndReload() {
    await sync();
    await refresh();
  }

  const hasConnections = connections.length > 0;
  const needsConnection = !connectionsLoading && !hasConnections;
  const allocated = totalAllocated !== null && total > 0 ? Math.min(totalAllocated, total) : null;
  const problems = [syncError, ...(lastResult?.errors.map((e) => e.error) ?? [])].filter(Boolean) as string[];

  return (
    <Screen>
      <ProfileHeader />
      {needsConnection ? (
        <View style={styles.emptyState}>
          <EmptyIllustration icon={Wallet} chipIcon={Link} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Connect your first account</Text>
            <Text style={styles.emptyText}>
              Add a wallet or an exchange and we will sync your balances right away.
            </Text>
          </View>
          <View style={styles.emptyAction}>
            <Button title="Add connection" onPress={() => router.push('/add-connection')} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={assetTotals}
          keyExtractor={(item) => item.asset}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={syncing} onRefresh={syncAndReload} tintColor={theme.colors.text.secondary} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <HeroBalanceCard
                total={total}
                allocated={allocated}
                lastSyncedAt={lastSyncedAt}
                onPress={() => router.push('/envelopes')}
              />
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
              <AssetRow
                symbol={item.asset}
                iconUrl={item.iconUrl}
                amount={item.amount}
                expanded={open}
                onPress={() => setExpanded(open ? null : item.asset)}>
                {item.byConnection.map((share) => (
                  <View key={share.connectionId} style={styles.shareRow}>
                    <Text style={[styles.muted, styles.shareLabel]}>{share.label}</Text>
                    <Text style={styles.shareAmount}>{formatAmount(share.amount)}</Text>
                  </View>
                ))}
              </AssetRow>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space[3] },
  header: { gap: theme.space[4], marginBottom: theme.space[1] },
  sectionTitle: { ...theme.typography.titleSection, color: theme.colors.text.primary, marginTop: theme.space[2] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space[6], paddingBottom: theme.space[8] },
  emptyCopy: { alignItems: 'center', gap: theme.space[2] },
  emptyAction: { alignSelf: 'stretch' },
  emptyText: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center' },
  emptyTitle: { ...theme.typography.titleScreen, color: theme.colors.text.primary, textAlign: 'center' },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[4] },
  shareLabel: { flexShrink: 1 },
  shareAmount: { ...theme.typography.bodySecondary, fontSize: 14, color: theme.colors.text.secondary },
  muted: { ...theme.typography.bodySecondary, fontSize: 14, color: theme.colors.text.secondary },
  error: { ...theme.typography.bodySecondary, color: theme.colors.status.error },
});
