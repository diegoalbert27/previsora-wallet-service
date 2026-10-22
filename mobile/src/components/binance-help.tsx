import * as Haptics from 'expo-haptics';
import { BookOpen, CircleHelp, KeyRound, Lock, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { theme } from '@/theme';

function Point({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: string }) {
  return (
    <View style={styles.point}>
      <View style={styles.pointIcon}>
        <Icon size={20} color={theme.colors.brand.lime} strokeWidth={1.75} />
      </View>
      <View style={styles.pointText}>
        <Text style={styles.pointTitle}>{title}</Text>
        <Text style={styles.pointBody}>{children}</Text>
      </View>
    </View>
  );
}

/**
 * Floating "?" that explains how to connect Binance safely: a read-only key, and how the keys are handled.
 * Render it only while the Binance form is showing; it floats over the bottom-right corner of its parent.
 */
export function BinanceHelp() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  function show() {
    Haptics.selectionAsync().catch(() => {});
    setOpen(true);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="How to connect Binance safely"
        onPress={show}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + theme.space[4] }, pressed && styles.fabPressed]}>
        <CircleHelp size={26} color={theme.colors.brand.onLime} strokeWidth={2} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Connecting Binance safely">
        <View style={styles.points}>
          <Point icon={KeyRound} title="Create a read-only API key">
            In Binance, enable only “Enable Reading”. Leave trading, withdrawals and transfers off, so this key can never
            move your funds.
          </Point>
          <Point icon={ShieldCheck} title="Minimum privileges">
            We only need to read your balances. Never share a key that can trade or withdraw.
          </Point>
          <Point icon={Lock} title="How we handle your keys">
            Your API key and secret are encrypted before they are stored, and are used only to read your balances.
          </Point>
          <Point icon={BookOpen} title="Step-by-step guide">
            A tutorial showing where to find your API key and secret is coming soon.
          </Point>
        </View>
        <Button title="Got it" onPress={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.space[4],
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.brand.lime,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabPressed: { opacity: 0.85 },
  points: { gap: theme.space[5], paddingVertical: theme.space[3], marginBottom: theme.space[2] },
  point: { flexDirection: 'row', gap: theme.space[3] },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, gap: 2 },
  pointTitle: { ...theme.typography.bodyStrong, color: theme.colors.text.primary },
  pointBody: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },
});
