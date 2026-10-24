import { ChevronRight } from 'lucide-react-native';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { usePressScale } from '@/components/ui/usePressScale';
import { displayName } from '@/lib/user-name';
import { theme } from '@/theme';

interface UserHeaderProps {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  /** Used when the account has no name (created before names were collected). */
  email: string | null | undefined;
  /** Makes the whole header tappable (it opens the profile) and shows the chevron. */
  onPress?: () => void;
}

/** Home header: avatar with the user's initials, "Welcome back" and their full name (DESIGN_SYSTEM.md §5.6). */
export function UserHeader({ onPress, ...name }: UserHeaderProps) {
  const press = usePressScale();

  return (
    <Animated.View style={press.style}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={styles.row}>
        <Avatar {...name} size={46} />
        <View style={styles.text}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name} numberOfLines={1}>
            {displayName(name)}
          </Text>
        </View>
        {onPress ? <ChevronRight size={22} color={theme.colors.text.secondary} /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  text: { flex: 1 },
  welcome: { ...theme.typography.label, color: theme.colors.text.secondary },
  name: { ...theme.typography.titleGreeting, fontSize: 21, lineHeight: 27, color: theme.colors.text.primary },
});
