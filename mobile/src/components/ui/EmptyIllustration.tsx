import { Plus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { theme } from '@/theme';

interface EmptyIllustrationProps {
  /** Main icon, drawn in lime inside the card. */
  icon: LucideIcon;
  /** Small icon in the grey chip on the top-left corner. */
  chipIcon: LucideIcon;
}

/**
 * Placeholder illustration for empty states, composed from icons: a main icon in a card, a grey chip and a lime "add"
 * badge. Swap the contents for real artwork (SVG, PNG or Lottie) without touching the screens that use it.
 */
export function EmptyIllustration({ icon: Icon, chipIcon: ChipIcon }: EmptyIllustrationProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Icon size={72} color={theme.colors.brand.lime} strokeWidth={1.5} />
      </View>
      <View style={[styles.chip, styles.linkChip]}>
        <ChipIcon size={18} color={theme.colors.text.secondary} />
      </View>
      <View style={[styles.chip, styles.addChip]}>
        <Plus size={22} color={theme.colors.brand.onLime} strokeWidth={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 150,
    height: 150,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 4,
    borderColor: theme.colors.bg.app, // separates the chip from the card behind it
  },
  linkChip: { top: 0, left: 0, width: 44, height: 44, backgroundColor: theme.colors.bg.surface3 },
  addChip: { bottom: 0, right: 0, width: 48, height: 48, backgroundColor: theme.colors.brand.lime },
});
