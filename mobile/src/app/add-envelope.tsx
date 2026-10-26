import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { EnvelopeIconPicker } from '@/components/ui/EnvelopeIconPicker';
import { TokenAvatar } from '@/components/ui/TokenAvatar';
import { DEFAULT_ENVELOPE_ICON } from '@/lib/envelope-icons';
import { createEnvelope, getEnvelopeAsset, listSupportedAssets, updateEnvelope } from '@/services/envelopes';
import { colors, radius, spacing } from '@/theme';

const MAX_NAME_LENGTH = 100;

export default function AddEnvelopeScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string; icon?: string }>();
  const editingId = params.id;
  const isEditing = !!editingId;

  const [name, setName] = useState(params.name ?? '');
  const [icon, setIcon] = useState(params.icon || DEFAULT_ENVELOPE_ICON);
  const [assets, setAssets] = useState<{ symbol: string; iconUrl: string | null }[]>([]);
  const [asset, setAsset] = useState<string | null>(null);
  const [originalAsset, setOriginalAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listSupportedAssets(), editingId ? getEnvelopeAsset(editingId) : Promise.resolve(null)])
      .then(([rows, current]) => {
        if (cancelled) return;
        setOriginalAsset(current);
        setAssets(rows.map((r) => ({ symbol: r.symbol, iconUrl: r.icon_url })));
        setAsset((selected) => selected ?? current);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  function save() {
    const trimmed = name.trim();
    const problem = !trimmed ? 'Name is required.' : trimmed.length > MAX_NAME_LENGTH ? `Name must be at most ${MAX_NAME_LENGTH} characters.` : null;
    setNameError(problem);
    setError(null);
    if (problem) return;
    if (!asset) {
      setError('Choose a currency for the envelope.');
      return;
    }

    if (editingId && originalAsset && asset !== originalAsset) {
      Alert.alert(
        'Change currency?',
        `This envelope will only receive ${asset} from now on. Its allocations from other currencies will be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change', style: 'destructive', onPress: () => persist(trimmed, asset) },
        ],
      );
      return;
    }
    persist(trimmed, asset);
  }

  async function persist(trimmed: string, selectedAsset: string) {
    setLoading(true);
    try {
      if (editingId) await updateEnvelope(editingId, { name: trimmed, icon, asset: selectedAsset });
      else await createEnvelope({ name: trimmed, asset: selectedAsset, icon });
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isEditing ? 'Edit envelope' : 'New envelope'}</Text>
          <EnvelopeIconPicker value={icon} onChange={setIcon} />
          <TextField
            label="Name"
            autoFocus
            placeholder="e.g. Emergency fund"
            autoCapitalize="sentences"
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChangeText={setName}
            error={nameError}
          />
          <View style={styles.assetGroup}>
            <Text style={styles.label}>Currency</Text>
            <Text style={styles.hint}>This envelope only receives money from funding sources in this currency.</Text>
            <View style={styles.chips}>
              {assets.map(({ symbol, iconUrl }) => (
                <Pressable
                  key={symbol}
                  onPress={() => setAsset(symbol)}
                  style={[styles.chip, symbol === asset && styles.chipActive]}>
                  <TokenAvatar symbol={symbol} iconUrl={iconUrl} size={28} />
                  <Text style={[styles.chipLabel, symbol === asset && styles.chipLabelActive]}>{symbol}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Save" onPress={save} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  error: { color: colors.danger, fontSize: 14 },
  assetGroup: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
