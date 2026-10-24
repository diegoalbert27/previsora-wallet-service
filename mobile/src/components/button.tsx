import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** `light` is a white button with dark text, used for third-party sign-in such as Google. */
  variant?: 'primary' | 'secondary' | 'light';
  /** Shown to the left of the label. */
  icon?: ReactNode;
}

const LIGHT_BACKGROUND = '#FFFFFF';
const LIGHT_TEXT = '#1F1F1F';

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon }: ButtonProps) {
  const textColor = variant === 'primary' ? colors.primaryText : variant === 'light' ? LIGHT_TEXT : colors.primary;
  const variantStyle = variant === 'primary' ? styles.primary : variant === 'light' ? styles.light : styles.secondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [styles.base, variantStyle, pressed && styles.pressed, disabled && styles.disabled]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 13, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  light: { backgroundColor: LIGHT_BACKGROUND },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  label: { fontSize: 15, fontWeight: '600' },
});
