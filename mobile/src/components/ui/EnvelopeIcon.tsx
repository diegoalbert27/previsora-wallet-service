import { StyleSheet, View } from 'react-native';
import { DEFAULT_ENVELOPE_ICON, ENVELOPE_ICON_BY_KEY } from '@/lib/envelope-icons';
import { theme } from '@/theme';

/** Square surface3 container with the envelope's chosen icon (DESIGN_SYSTEM.md §5.2 leading icon). */
export function EnvelopeIcon({ name, size = 40 }: { name: string | null | undefined; size?: number }) {
  // Unknown or missing keys (envelopes created before icons existed) get the default icon.
  const Icon = ENVELOPE_ICON_BY_KEY[name ?? ''] ?? ENVELOPE_ICON_BY_KEY[DEFAULT_ENVELOPE_ICON];
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon size={size * 0.55} color={theme.colors.text.primary} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.bg.surface3, alignItems: 'center', justifyContent: 'center' },
});
