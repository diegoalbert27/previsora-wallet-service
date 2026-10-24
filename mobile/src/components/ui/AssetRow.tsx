import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { TokenAvatar } from '@/components/ui/TokenAvatar';
import { usePressScale } from '@/components/ui/usePressScale';
import { theme } from '@/theme';

interface AssetRowProps {
  symbol: string;
  iconUrl?: string | null;
  amount: number;
  /** Makes the row tappable; the chevron and `children` (shown while `expanded`) appear with it. */
  onPress?: () => void;
  expanded?: boolean;
  children?: ReactNode;
}

const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

export function AssetRow({ symbol, iconUrl, amount, onPress, expanded = false, children }: AssetRowProps) {
  const press = usePressScale();
  const Chevron = expanded ? ChevronUp : ChevronDown;

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  }

  return (
    <Animated.View style={press.style}>
      <Pressable
        disabled={!onPress}
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        android_ripple={{ color: theme.colors.border.subtle }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.row}>
          <TokenAvatar symbol={symbol} iconUrl={iconUrl} size={40} />
          <Text style={styles.name}>{symbol}</Text>
          <Text style={styles.amount}>{formatAmount(amount)}</Text>
          {onPress ? <Chevron size={18} color={theme.colors.text.secondary} /> : null}
        </View>
        {expanded ? children : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.surface1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingVertical: 14,
    paddingHorizontal: theme.space[4],
    gap: theme.space[3],
    overflow: 'hidden',
  },
  pressed: { backgroundColor: theme.colors.bg.surface2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  name: { ...theme.typography.bodyStrong, fontSize: 16, lineHeight: 21, flex: 1, color: theme.colors.text.primary },
  amount: {
    ...theme.typography.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
});
