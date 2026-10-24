import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /**
   * Safe-area edges to respect. Screens above the tab bar keep `['top']` because the bar already
   * covers the bottom inset; every other screen needs the bottom one so its last button is not
   * hidden behind the system navigation bar.
   */
  edges?: Edge[];
  /** Scrolls the content and lifts it above the keyboard, for screens with several inputs. */
  scroll?: boolean;
}

export function Screen({ children, edges = ['top', 'bottom'], scroll = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Padding is applied from the measured insets instead of the native SafeAreaView, which did not
  // reliably reserve the bottom inset inside modal screens on Android.
  const inset = { paddingTop: edges.includes('top') ? insets.top : 0, paddingBottom: edges.includes('bottom') ? insets.bottom : 0 };

  return (
    <View style={[styles.safe, inset]}>
      {scroll ? (
        <KeyboardAvoidingView style={styles.safe} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md, gap: spacing.md },
  scrollContent: { flexGrow: 1, padding: spacing.md, gap: spacing.md },
});
