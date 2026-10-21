import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { createEnvelope, listSupportedAssets } from '@/services/envelopes';
import { colors, radius, spacing } from '@/theme';

const MAX_NAME_LENGTH = 100;

export default function AddEnvelopeScreen() {
  const [name, setName] = useState('');
  const [assets, setAssets] = useState<string[]>([]);
  const [asset, setAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSupportedAssets()
      .then((rows) => {
        if (cancelled) return;
        setAssets(rows.map((r) => r.symbol));
        setAsset((current) => current ?? rows[0]?.symbol ?? null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    const trimmed = name.trim();
    const problem = !trimmed ? 'Name is required.' : trimmed.length > MAX_NAME_LENGTH ? `Name must be at most ${MAX_NAME_LENGTH} characters.` : null;
    setNameError(problem);
    setError(null);
    if (problem) return;
    if (!asset) {
      setError('Choose a currency for the envelope.');
      return;
    }

    setLoading(true);
    try {
      await createEnvelope({ name: trimmed, asset });
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New envelope</Text>
        <TextField
          label="Name"
          placeholder="e.g. Emergency fund"
          autoCapitalize="sentences"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChangeText={setName}
          error={nameError}
        />
        <View style={styles.assetGroup}>
          <Text style={styles.label}>Currency</Text>
          <View style={styles.chips}>
            {assets.map((symbol) => (
              <Pressable
                key={symbol}
                onPress={() => setAsset(symbol)}
                style={[styles.chip, symbol === asset && styles.chipActive]}>
                <Text style={[styles.chipLabel, symbol === asset && styles.chipLabelActive]}>{symbol}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save" onPress={save} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  error: { color: colors.danger, fontSize: 14 },
  assetGroup: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { color: colors.text, fontWeight: '500' },
  chipLabelActive: { color: colors.primaryText },
});
