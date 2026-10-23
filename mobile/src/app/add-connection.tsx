import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { BinanceHelp } from '@/components/binance-help';
import { ConnectionForm, type Kind } from '@/components/connection-form';
import { Screen } from '@/components/screen';
import { useConnections } from '@/providers/connections-provider';
import { colors, spacing } from '@/theme';

export default function AddConnectionScreen() {
  const { refresh } = useConnections();
  const [kind, setKind] = useState<Kind>('wallet');

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, kind === 'binance' && styles.contentWithHelp]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add connection</Text>
        <ConnectionForm
          onKindChange={setKind}
          onDone={async () => {
            await refresh();
            router.back();
          }}
        />
      </ScrollView>
      {kind === 'binance' ? <BinanceHelp /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  contentWithHelp: { paddingBottom: 104 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
});
