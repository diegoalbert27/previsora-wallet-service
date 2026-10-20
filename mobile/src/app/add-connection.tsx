import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ConnectionForm } from '@/components/connection-form';
import { Screen } from '@/components/screen';
import { useConnections } from '@/providers/connections-provider';
import { colors, spacing } from '@/theme';

export default function AddConnectionScreen() {
  const { refresh } = useConnections();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add connection</Text>
        <ConnectionForm
          onDone={async () => {
            await refresh();
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
});
