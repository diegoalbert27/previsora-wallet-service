import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight } from 'lucide-react-native';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { usePressScale } from '@/components/ui/usePressScale';
import { splitTotal } from '@/lib/format';
import { theme } from '@/theme';

interface HeroBalanceCardProps {
  total: number;
  /** Amount assigned to envelopes. `null` hides the distribution (no total, or the data is unavailable). */
  allocated: number | null;
  lastSyncedAt: string | null;
  /** Opens the detail behind the card; the arrow in the corner promises it. */
  onPress?: () => void;
}

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function HeroBalanceCard({ total, allocated, lastSyncedAt, onPress }: HeroBalanceCardProps) {
  const press = usePressScale();
  const parts = splitTotal(total);

  // Integer percentages that always add up to 100.
  const distribution =
    allocated !== null && total > 0
      ? (() => {
          const assigned = Math.min(allocated, total);
          const assignedPct = Math.round((assigned / total) * 100);
          return { assigned, assignedPct, free: total - assigned, freePct: 100 - assignedPct };
        })()
      : null;

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  }

  return (
    <Animated.View style={press.style}>
      <Pressable disabled={!onPress} onPress={handlePress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
        <LinearGradient {...theme.gradients.hero} style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.label}>Total balance</Text>
            <ArrowUpRight size={20} color="rgba(255,255,255,0.8)" />
          </View>

          <Text style={styles.balance}>
            ${parts.whole}
            <Text style={styles.fraction}>{parts.fraction}</Text>
          </Text>

          {distribution ? (
            <View style={styles.distribution}>
              <ProgressBar percentage={distribution.assignedPct} />
              <View style={styles.kpiRow}>
                <View>
                  <Text style={styles.kpiLabel}>Allocated</Text>
                  <Text style={styles.kpiValue}>
                    {formatUsd(distribution.assigned)} ({distribution.assignedPct}%)
                  </Text>
                </View>
                <View style={styles.kpiRight}>
                  <Text style={styles.kpiLabel}>Unallocated</Text>
                  <Text style={styles.kpiValue}>
                    {formatUsd(distribution.free)} ({distribution.freePct}%)
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: theme.space[5],
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...theme.typography.label, color: theme.colors.text.secondary },
  balance: { ...theme.typography.displayBalance, color: theme.colors.text.primary, marginTop: theme.space[2] },
  fraction: { fontSize: 20, lineHeight: 42, letterSpacing: -0.4 },
  meta: { ...theme.typography.microButton, color: theme.colors.text.secondary, marginTop: theme.space[1] },
  distribution: { gap: theme.space[3], marginTop: theme.space[5] },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[4] },
  kpiRight: { alignItems: 'flex-end' },
  kpiLabel: { ...theme.typography.microButton, color: theme.colors.text.secondary },
  kpiValue: { ...theme.typography.bodySecondary, fontFamily: theme.typography.bodyStrong.fontFamily, color: theme.colors.text.primary },
});
