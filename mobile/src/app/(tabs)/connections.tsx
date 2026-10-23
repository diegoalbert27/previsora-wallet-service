import { router, useFocusEffect } from 'expo-router';
import { Trash2, Unplug, Wallet } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { ProfileHeader } from '@/components/ui/ProfileHeader';
import { ProviderIcon } from '@/components/ui/ProviderIcon';
import { networkOption } from '@/lib/networks';
import { listBalances } from '@/services/balances';
import { connectionLabel } from '@/hooks/use-balances';
import { useConnections } from '@/providers/connections-provider';
import { deleteConnection } from '@/services/connections';
import { colors, radius, spacing, theme } from '@/theme';
import type { Balance, Connection } from '@/types/database';

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const shortAddress = (address: string | null) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '');
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

interface ConnectionRowProps {
  connection: Connection;
  total: number | null;
  assetCount: number;
  deleting: boolean;
  onRequestDelete: (connection: Connection, close: () => void) => void;
}

function ConnectionRow({ connection, total, assetCount, deleting, onRequestDelete }: ConnectionRowProps) {
  const swipeable = useRef<SwipeableMethods>(null);
  const isExchange = connection.connection_type === 'CEX';
  const network = networkOption(connection.network);
  const title = isExchange ? capitalize(connection.provider) : `${network?.label ?? connection.network ?? 'On-chain'} wallet`;
  const subtitle = isExchange ? 'Exchange · API connected' : shortAddress(connection.public_address);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      enabled={!deleting}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actionSlot}>
          <View style={styles.action}>
            <Trash2 size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Delete</Text>
          </View>
        </View>
      )}
      onSwipeableOpen={() => onRequestDelete(connection, () => swipeable.current?.close())}>
      <View style={[styles.card, deleting && styles.deleting]}>
        <ProviderIcon connection={connection} size={52} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {network?.testnet ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>Testnet</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.muted} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.totals}>
          <Text style={styles.total}>{total === null ? '—' : formatUsd(total)}</Text>
          <Text style={styles.muted}>
            {total === null ? 'Not synced' : `${assetCount} ${assetCount === 1 ? 'asset' : 'assets'}`}
          </Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

export default function ConnectionsScreen() {
  const { connections, loading, refresh } = useConnections();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listBalances()
        .then(setBalances)
        .catch(() => setBalances(null));
    }, []),
  );

  const summaryByConnection = useMemo(() => {
    const map = new Map<string, { total: number; assetCount: number }>();
    for (const b of balances ?? []) {
      const entry = map.get(b.connection_id) ?? { total: 0, assetCount: 0 };
      entry.total += b.amount;
      if (b.amount > 0) entry.assetCount += 1;
      map.set(b.connection_id, entry);
    }
    return map;
  }, [balances]);

  const isEmpty = !loading && connections.length === 0;

  function confirmDelete(connection: Connection, close: () => void) {
    Alert.alert(
      'Delete connection',
      `${connectionLabel(connection)} and its synced balances will be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: close },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(connection.id);
            try {
              await deleteConnection(connection.id);
              await refresh();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setDeletingId(null);
              close();
            }
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  }

  return (
    <Screen>
      <ProfileHeader />
      {isEmpty ? (
        <View style={styles.emptyState}>
          <EmptyIllustration icon={Unplug} chipIcon={Wallet} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>No connections yet</Text>
            <Text style={styles.emptyText}>Add a wallet or an exchange to start tracking your balances.</Text>
          </View>
          <View style={styles.emptyAction}>
            <Button title="Add connection" onPress={() => router.push('/add-connection')} />
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: spacing.sm, flexGrow: 1 }}
            renderItem={({ item }) => (
              <ConnectionRow
                connection={item}
                total={summaryByConnection.get(item.id)?.total ?? null}
                assetCount={summaryByConnection.get(item.id)?.assetCount ?? 0}
                deleting={deletingId === item.id}
                onRequestDelete={confirmDelete}
              />
            )}
            ListFooterComponent={<Text style={styles.hint}>Swipe a connection to the left to delete it.</Text>}
          />
          <Button title="Add connection" onPress={() => router.push('/add-connection')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 20,
    gap: spacing.md,
  },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: theme.colors.status.warningBg,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeLabel: { ...theme.typography.microBadge, color: theme.colors.status.warning },
  totals: { alignItems: 'flex-end', gap: 4 },
  total: { ...theme.typography.bodyStrong, fontSize: 17, lineHeight: 22, color: colors.text },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, flexShrink: 1 },
  muted: { fontSize: 14, color: colors.textMuted },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.xl },
  emptyCopy: { alignItems: 'center', gap: spacing.sm },
  emptyAction: { alignSelf: 'stretch' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  deleting: { opacity: 0.5 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
  actionSlot: { width: 104, paddingLeft: spacing.sm },
  action: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
