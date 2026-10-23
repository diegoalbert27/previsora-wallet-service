import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { Pencil, Percent, PiggyBank, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { EnvelopeIcon } from '@/components/ui/EnvelopeIcon';
import { ProfileHeader } from '@/components/ui/ProfileHeader';
import { TokenAvatar } from '@/components/ui/TokenAvatar';
import { splitTotal } from '@/lib/format';
import { sourceName } from '@/lib/labels';
import { deleteEnvelope, getEnvelopeAllocations, getEnvelopes, listSupportedAssets } from '@/services/envelopes';
import { colors, radius, spacing } from '@/theme';
import type { EnvelopeAllocation, EnvelopeBalance } from '@/types/database';

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const formatPercentage = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

interface EnvelopeRowProps {
  envelope: EnvelopeBalance;
  sources: EnvelopeAllocation[];
  assetIcons: Record<string, string | null>;
  open: boolean;
  deleting: boolean;
  onToggle: () => void;
  onRequestEdit: (envelope: EnvelopeBalance) => void;
  onRequestDelete: (envelope: EnvelopeBalance, close: () => void) => void;
}

function EnvelopeRow({ envelope, sources, assetIcons, open, deleting, onToggle, onRequestEdit, onRequestDelete }: EnvelopeRowProps) {
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      enabled={!deleting}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <View style={[styles.actionSlot, styles.actionSlotLeft]}>
          <View style={[styles.action, styles.editAction]}>
            <Pencil size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Edit</Text>
          </View>
        </View>
      )}
      renderRightActions={() => (
        <View style={[styles.actionSlot, styles.actionSlotRight]}>
          <View style={[styles.action, styles.deleteAction]}>
            <Trash2 size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Delete</Text>
          </View>
        </View>
      )}
      onSwipeableOpen={(direction) => {
        if (direction === SwipeDirection.RIGHT) {
          onRequestEdit(envelope);
          swipeable.current?.close();
        } else {
          onRequestDelete(envelope, () => swipeable.current?.close());
        }
      }}>
      <Pressable style={[styles.card, deleting && styles.deleting]} onPress={onToggle}>
        <View style={styles.row}>
          <View style={styles.identity}>
            <EnvelopeIcon name={envelope.icon} size={46} />
            <Text style={styles.title} numberOfLines={1}>
              {envelope.name}
            </Text>
          </View>
          <View style={styles.amountGroup}>
            <Text style={styles.title}>{formatUsd(envelope.allocated_amount)}</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </View>
        </View>
        {open &&
          (sources.length === 0 ? (
            <Text style={styles.muted}>No funding sources yet. Use Manage Allocation to assign some.</Text>
          ) : (
            sources.map((s) => (
              <View key={`${s.source_connection_id}:${s.asset}`} style={styles.sourceRow}>
                <TokenAvatar symbol={s.asset} iconUrl={assetIcons[s.asset]} size={32} />
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceName} numberOfLines={1}>
                    {sourceName(s)}
                  </Text>
                  <Text style={styles.muted}>
                    {s.asset} · {formatPercentage(s.percentage)}
                  </Text>
                </View>
                <Text style={styles.sourceAmount}>{formatUsd(s.allocated_amount)}</Text>
              </View>
            ))
          ))}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function EnvelopesScreen() {
  const [envelopes, setEnvelopes] = useState<EnvelopeBalance[]>([]);
  const [allocations, setAllocations] = useState<EnvelopeAllocation[]>([]);
  // Icon per asset symbol; the allocations view does not carry the image.
  const [icons, setIcons] = useState<Record<string, string | null>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [envelopeRows, allocationRows, assetRows] = await Promise.all([
        getEnvelopes(),
        getEnvelopeAllocations(),
        listSupportedAssets().catch(() => []),
      ]);
      setEnvelopes(envelopeRows);
      setAllocations(allocationRows);
      setIcons(Object.fromEntries(assetRows.map((a) => [a.symbol, a.icon_url])));
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

  function editEnvelope(envelope: EnvelopeBalance) {
    router.push({
      pathname: '/add-envelope',
      params: { id: envelope.envelope_id, name: envelope.name, icon: envelope.icon ?? '' },
    });
  }

  function confirmDelete(envelope: EnvelopeBalance, close: () => void) {
    Alert.alert(
      'Delete envelope',
      `"${envelope.name}" and its allocation rules will be removed. The percentages it received become unallocated.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: close },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(envelope.envelope_id);
            try {
              await deleteEnvelope(envelope.envelope_id);
              await load();
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

  const totalAllocated = useMemo(() => envelopes.reduce((sum, e) => sum + e.allocated_amount, 0), [envelopes]);

  const totalParts = splitTotal(totalAllocated);
  const isEmpty = !loading && envelopes.length === 0;

  const sourcesByEnvelope = useMemo(() => {
    const map = new Map<string, EnvelopeAllocation[]>();
    for (const a of allocations) map.set(a.envelope_id, [...(map.get(a.envelope_id) ?? []), a]);
    return map;
  }, [allocations]);

  return (
    <Screen>
      <ProfileHeader />
      {isEmpty ? (
        <View style={styles.emptyState}>
          <EmptyIllustration icon={PiggyBank} chipIcon={Percent} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>No envelopes yet</Text>
            <Text style={styles.emptyText}>Create an envelope to start organizing your savings.</Text>
          </View>
          <View style={styles.emptyAction}>
            <Button title="Add envelope" onPress={() => router.push('/add-envelope')} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <>
          <FlatList
            data={envelopes}
            keyExtractor={(item) => item.envelope_id}
            extraData={expanded}
            contentContainerStyle={{ gap: spacing.sm, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              error || envelopes.length > 0 ? (
                <View style={styles.header}>
                  {envelopes.length > 0 ? (
                    <View style={styles.totalCard}>
                      <Text style={styles.totalLabel}>Total allocated</Text>
                      <Text style={styles.totalValue}>
                        ≈ ${totalParts.whole}
                        <Text style={styles.totalFraction}>{totalParts.fraction}</Text>
                      </Text>
                    </View>
                  ) : null}
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                </View>
              ) : undefined
            }
            renderItem={({ item }) => (
              <EnvelopeRow
                envelope={item}
                sources={sourcesByEnvelope.get(item.envelope_id) ?? []}
                assetIcons={icons}
                open={expanded === item.envelope_id}
                deleting={deletingId === item.envelope_id}
                onToggle={() => setExpanded(expanded === item.envelope_id ? null : item.envelope_id)}
                onRequestEdit={editEnvelope}
                onRequestDelete={confirmDelete}
              />
            )}
            ListFooterComponent={
              <Text style={styles.hint}>Swipe an envelope right to edit it, or left to delete it.</Text>
            }
          />
          <Button title="Add envelope" onPress={() => router.push('/add-envelope')} />
          <Button title="Manage Allocation" variant="secondary" onPress={() => router.push('/manage-rules')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  totalCard: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  totalLabel: { color: colors.primaryText, opacity: 0.85, fontSize: 14 },
  totalValue: { color: colors.primaryText, fontSize: 32, fontWeight: '700' },
  totalFraction: { fontSize: 16, fontWeight: '500', opacity: 0.85 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 20, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  deleting: { opacity: 0.5 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
  actionSlot: { width: 104 },
  actionSlotLeft: { paddingRight: spacing.sm },
  actionSlotRight: { paddingLeft: spacing.sm },
  action: { flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  editAction: { backgroundColor: '#2C2C2C' },
  deleteAction: { backgroundColor: colors.danger },
  actionLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  amountGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, flexShrink: 1 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sourceInfo: { flex: 1, gap: 2 },
  sourceName: { fontSize: 15, fontWeight: '500', color: colors.text },
  sourceAmount: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.xl },
  emptyCopy: { alignItems: 'center', gap: spacing.sm },
  emptyAction: { alignSelf: 'stretch' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14 },
});
