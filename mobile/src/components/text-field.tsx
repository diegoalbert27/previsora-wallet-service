import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  /** Red border without a message, for when the error is explained elsewhere (e.g. wrong credentials). */
  invalid?: boolean;
}

export function TextField({ label, error, invalid, style, secureTextEntry, ...props }: TextFieldProps) {
  // Secret fields (passwords, API secrets) get an eye button to reveal or hide what was typed.
  const isSecret = secureTextEntry === true;
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecret && hidden}
          style={[styles.input, isSecret && styles.inputWithToggle, error || invalid ? styles.inputError : null, style]}
          {...props}
        />
        {isSecret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show text' : 'Hide text'}
            hitSlop={8}
            onPress={() => setHidden((current) => !current)}
            style={styles.toggle}>
            {hidden ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputWithToggle: { paddingRight: 48 },
  toggle: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 13, color: colors.danger },
});
