import * as Haptics from 'expo-haptics';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BottomSheet } from '@/components/bottom-sheet';
import { EnvelopeIcon } from '@/components/ui/EnvelopeIcon';
import { usePressScale } from '@/components/ui/usePressScale';
import { ENVELOPE_ICONS } from '@/lib/envelope-icons';
import { theme } from '@/theme';

const COLUMNS = 4;
const GAP = theme.space[3];
const SHEET_PADDING = theme.space[5];

interface EnvelopeIconPickerProps {
  value: string;
  onChange: (key: string) => void;
}

/** Large icon that opens a sheet with all the options when tapped (like picking an avatar). */
export function EnvelopeIconPicker({ value, onChange }: EnvelopeIconPickerProps) {
  const { width } = useWindowDimensions();
  const press = usePressScale();
  const [open, setOpen] = useState(false);
  const tile = (width - SHEET_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  function choose(key: string) {
    Haptics.selectionAsync().catch(() => {});
    onChange(key);
    setOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      <Animated.View style={press.style}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change icon"
          onPress={() => setOpen(true)}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}>
          <EnvelopeIcon name={value} size={96} />
          {/* The pencil tells the user the icon can be changed. */}
          <View style={styles.badge}>
            <Pencil size={14} color={theme.colors.brand.onLime} strokeWidth={2.5} />
          </View>
        </Pressable>
      </Animated.View>
      <Text style={styles.caption}>Tap to change the icon</Text>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Choose an icon">
        <View style={styles.grid}>
          {ENVELOPE_ICONS.map(({ key, label, Icon }) => {
            const active = key === value;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                onPress={() => choose(key)}
                style={[styles.tile, { width: tile }, active && styles.tileActive]}>
                <Icon size={26} color={active ? theme.colors.brand.lime : theme.colors.text.primary} strokeWidth={1.75} />
                <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: theme.space[2], paddingVertical: theme.space[2] },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.lime,
    borderWidth: 3,
    borderColor: theme.colors.bg.app,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingBottom: theme.space[2] },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.surface3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tileActive: { borderColor: theme.colors.brand.lime, backgroundColor: 'rgba(139,223,66,0.10)' },
  tileLabel: { ...theme.typography.microBadge, color: theme.colors.text.secondary },
  tileLabelActive: { color: theme.colors.brand.lime },
});
