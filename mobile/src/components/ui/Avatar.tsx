import { StyleSheet, Text, View } from 'react-native';
import { initialsOf } from '@/lib/user-name';
import { theme } from '@/theme';

interface AvatarProps {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email: string | null | undefined;
  size?: number;
}

/** Circle with the user's initials on surface3 (DESIGN_SYSTEM.md §6.2). */
export function Avatar({ size = 40, ...name }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4, lineHeight: size * 0.5 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.bg.surface3,
    borderWidth: 2,
    borderColor: theme.colors.bg.app,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: theme.typography.bodyStrong.fontFamily, color: theme.colors.text.primary },
});
