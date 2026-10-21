import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { getEnvelopes } from '@/services/envelopes';
import { getRules, upsertRules } from '@/services/rules';
import { colors, radius, spacing } from '@/theme';

interface Row {
  envelopeId: string;
  name: string;
}

// Up to 3 integer digits and 2 decimals, matching DECIMAL(5, 2).
const PERCENTAGE_INPUT = /^\d{0,3}([.,]\d{0,2})?$/;

const toNumber = (text: string) => (text === '' || text === '.' || text === ',' ? 0 : Number(text.replace(',', '.')));
const round2 = (n: number) => Math.round(n * 100) / 100;

export default function ManageRulesScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEnvelopes(), getRules()])
      .then(([envelopes, rules]) => {
        if (cancelled) return;
        const current = new Map(rules.map((r) => [r.envelope_id, r.percentage]));
        setRows(envelopes.map((e) => ({ envelopeId: e.envelope_id, name: e.name })));
        setValues(
          Object.fromEntries(
            envelopes.map((e) => {
              const pct = current.get(e.envelope_id);
              return [e.envelope_id, pct ? String(pct) : ''];
            }),
          ),
        );
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const allocated = useMemo(() => round2(Object.values(values).reduce((sum, v) => sum + toNumber(v), 0)), [values]);
  const unallocated = round2(100 - allocated);
  const overAllocated = unallocated < 0;

  function setValue(envelopeId: string, text: string) {
    if (PERCENTAGE_INPUT.test(text)) setValues((prev) => ({ ...prev, [envelopeId]: text }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await upsertRules(rows.map((r) => ({ envelope_id: r.envelopeId, percentage: toNumber(values[r.envelopeId] ?? '') })));
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={[styles.counter, overAllocated && styles.counterOver]}>
        <Text style={[styles.counterLabel, overAllocated && styles.counterTextOver]}>Unallocated</Text>
        <Text style={[styles.counterValue, overAllocated && styles.counterTextOver]}>{unallocated.toFixed(2)}%</Text>
      </View>
      {overAllocated ? <Text style={styles.error}>The total exceeds 100%. Reduce some percentages to save.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.envelopeId}
        contentContainerStyle={{ gap: spacing.sm, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? undefined : <Text style={styles.muted}>Create an envelope first, then come back to allocate your money.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={values[item.envelopeId] ?? ''}
                onChangeText={(text) => setValue(item.envelopeId, text)}
                selectTextOnFocus
              />
              <Text style={styles.percent}>%</Text>
            </View>
          </View>
        )}
      />

      <Button title="Save" onPress={save} loading={saving} disabled={overAllocated || loading || rows.length === 0} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  counterOver: { borderColor: colors.danger, backgroundColor: '#FDECEE' },
  counterLabel: { fontSize: 14, color: colors.textMuted },
  counterValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  counterTextOver: { color: colors.danger },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    width: 80,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  percent: { color: colors.textMuted },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: 14 },
});
