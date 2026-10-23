import { router } from 'expo-router';
import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { EnvelopeIcon } from '@/components/ui/EnvelopeIcon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TokenAvatar } from '@/components/ui/TokenAvatar';
import { sourceName } from '@/lib/labels';
import { getEnvelopes } from '@/services/envelopes';
import { getFundingSources, getRules, upsertRules } from '@/services/rules';
import { theme } from '@/theme';
import type { FundingSource } from '@/types/database';

interface Row {
  envelopeId: string;
  name: string;
  icon: string | null;
}

type Distribution = Record<string, Record<string, string>>;

const PERCENTAGE_INPUT = /^\d{0,3}([.,]\d{0,2})?$/;

const sourceKey = (s: { connection_id: string; asset: string }) => `${s.connection_id}:${s.asset}`;
const toNumber = (text: string) => (text === '' || text === '.' || text === ',' ? 0 : Number(text.replace(',', '.')));
const round2 = (n: number) => Math.round(n * 100) / 100;
const formatAmount = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ALL = 'ALL';
const categoryOf = (s: FundingSource) => (s.connection_type === 'CEX' ? s.provider : 'WALLET');
const categoryLabel = (category: string) =>
  category === ALL ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function ManageRulesScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [distribution, setDistribution] = useState<Distribution>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [filter, setFilter] = useState(ALL);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEnvelopes(), getFundingSources(), getRules()])
      .then(([envelopes, fundingSources, rules]) => {
        if (cancelled) return;
        const initial: Distribution = {};
        for (const rule of rules) {
          const key = sourceKey({ connection_id: rule.source_connection_id, asset: rule.source_asset });
          (initial[key] ??= {})[rule.envelope_id] = rule.percentage ? String(rule.percentage) : '';
        }
        setRows(envelopes.map((e) => ({ envelopeId: e.envelope_id, name: e.name, icon: e.icon })));
        setSources(fundingSources);
        setDistribution(initial);
        setSelectedKey(fundingSources[0] ? sourceKey(fundingSources[0]) : null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => sources.find((s) => sourceKey(s) === selectedKey) ?? null, [sources, selectedKey]);
  const values = useMemo(() => (selectedKey ? (distribution[selectedKey] ?? {}) : {}), [distribution, selectedKey]);
  const allocated = useMemo(() => round2(Object.values(values).reduce((sum, v) => sum + toNumber(v), 0)), [values]);
  const unallocated = round2(100 - allocated);
  const overAllocated = unallocated < 0;

  function setValue(envelopeId: string, text: string) {
    if (!selectedKey || !PERCENTAGE_INPUT.test(text)) return;
    setDistribution((prev) => ({ ...prev, [selectedKey]: { ...prev[selectedKey], [envelopeId]: text } }));
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await upsertRules(
        rows.map((r) => ({
          envelope_id: r.envelopeId,
          percentage: toNumber(values[r.envelopeId] ?? ''),
          source_connection_id: selected.connection_id,
          source_asset: selected.asset,
        })),
      );
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const canEdit = !loading && selected !== null && rows.length > 0;

  const categories = useMemo(() => [ALL, ...new Set(sources.map(categoryOf))], [sources]);
  const filteredSources = useMemo(
    () => (filter === ALL ? sources : sources.filter((source) => categoryOf(source) === filter)),
    [sources, filter],
  );
  const canPick = filteredSources.length > 1;

  function applyFilter(next: string) {
    setFilter(next);
    const visible = next === ALL ? sources : sources.filter((source) => categoryOf(source) === next);
    if (!visible.some((source) => sourceKey(source) === selectedKey) && visible[0]) {
      setSelectedKey(sourceKey(visible[0]));
    }
  }

  return (
    <Screen>
      <Text style={styles.screenTitle}>Manage allocation</Text>

      {categories.length > 2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filters}>
          {categories.map((category) => {
            const active = category === filter;
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => applyFilter(category)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{categoryLabel(category)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>        
        <Pressable
          disabled={!canPick}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose funding source"
          style={[styles.sourceCard, overAllocated && styles.sourceCardOver]}>
          <Text style={styles.cardLabel}>Funding source</Text>
          {selected ? (
            <>
              <View style={styles.sourceRow}>
                <TokenAvatar symbol={selected.asset} iconUrl={selected.icon_url} size={56} />
                <View style={styles.sourceText}>
                  <Text style={styles.sourceName} numberOfLines={1}>
                    {sourceName(selected)}
                  </Text>
                  <Text style={styles.sourceBalance}>
                    {formatAmount(selected.amount)} <Text style={styles.sourceAsset}>{selected.asset}</Text>
                  </Text>
                </View>
                {canPick ? <ChevronDown size={22} color={theme.colors.text.secondary} /> : null}
              </View>

              <ProgressBar
                percentage={allocated}
                fillColor={overAllocated ? theme.colors.status.error : theme.colors.brand.lime}
                trackColor="rgba(255,255,255,0.10)"
              />
              <View style={styles.unallocatedRow}>
                <Text style={styles.unallocatedLabel}>{overAllocated ? 'Over-allocated' : 'Unallocated'}</Text>
                <Text style={[styles.unallocatedValue, overAllocated && styles.overText]}>
                  {overAllocated ? `${Math.abs(unallocated).toFixed(2)}% over` : `${unallocated.toFixed(2)}%`}
                </Text>
              </View>
            </>
          ) : (
            !loading && <Text style={styles.muted}>No balances yet. Sync a wallet or exchange first.</Text>
          )}
        </Pressable>
        {overAllocated ? <Text style={styles.error}>The total exceeds 100%. Reduce some percentages to save.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Assign a percentage to each envelope</Text>
        <FlatList
          data={selected ? rows : []}
          keyExtractor={(item) => item.envelopeId}
          extraData={[selectedKey, focusedId]}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading || !selected ? undefined : (
              <Text style={styles.muted}>Create an envelope first, then come back to allocate your money.</Text>
            )
          }
          renderItem={({ item }) => {
            const text = values[item.envelopeId] ?? '';
            const focused = focusedId === item.envelopeId;
            const amountHint = selected ? (selected.amount * toNumber(text)) / 100 : 0;
            return (
              <View style={styles.row}>
                <EnvelopeIcon name={item.icon} size={48} />
                <View style={styles.rowText}>
                  <Text style={styles.envelopeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.envelopeHint}>≈ {formatUsd(amountHint)}</Text>
                </View>
                <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={text}
                    onChangeText={(value) => setValue(item.envelopeId, value)}
                    onFocus={() => setFocusedId(item.envelopeId)}
                    onBlur={() => setFocusedId((current) => (current === item.envelopeId ? null : current))}
                    selectTextOnFocus
                  />
                  <Text style={styles.percent}>%</Text>
                </View>
              </View>
            );
          }}
        />

        <Button title="Save" onPress={save} loading={saving} disabled={overAllocated || !canEdit} />
      </KeyboardAvoidingView>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Funding source">
        {filteredSources.map((source) => {
          const active = sourceKey(source) === selectedKey;
          return (
            <Pressable
              key={sourceKey(source)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setSelectedKey(sourceKey(source));
                setPickerOpen(false);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
              <TokenAvatar symbol={source.asset} iconUrl={source.icon_url} size={44} />
              <View style={styles.sourceText}>
                <Text style={styles.optionName} numberOfLines={1}>
                  {sourceName(source)}
                </Text>
                <Text style={styles.optionSub}>
                  {source.asset} · {formatAmount(source.amount)}
                </Text>
              </View>
              {active ? <Check size={20} color={theme.colors.brand.lime} strokeWidth={2.5} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { ...theme.typography.titleScreen, color: theme.colors.text.primary },
  body: { flex: 1, gap: theme.space[4] },

  filterScroll: { flexGrow: 0 },
  filters: { gap: theme.space[2] },
  filterChip: {
    height: 36,
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: theme.colors.brand.lime },
  filterLabel: { ...theme.typography.microButton, fontSize: 14, color: theme.colors.text.secondary },
  filterLabelActive: { color: theme.colors.text.onAccent },

  sourceCard: {
    backgroundColor: theme.colors.bg.surface1,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.space[5],
    gap: theme.space[4],
  },
  sourceCardOver: { borderColor: theme.colors.status.error, backgroundColor: theme.colors.status.errorBg },
  cardLabel: { ...theme.typography.label, color: theme.colors.text.secondary },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[4] },
  sourceText: { flex: 1, gap: 2 },
  sourceName: { ...theme.typography.titleCard, fontSize: 18, color: theme.colors.text.primary },
  sourceBalance: { ...theme.typography.kpiLarge, color: theme.colors.text.primary },
  sourceAsset: { ...theme.typography.bodyStrong, color: theme.colors.text.secondary },
  unallocatedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  unallocatedLabel: { ...theme.typography.label, color: theme.colors.text.secondary },
  unallocatedValue: { ...theme.typography.titleSection, color: theme.colors.text.primary },
  overText: { color: theme.colors.status.error },

  sectionTitle: { ...theme.typography.titleSection, color: theme.colors.text.primary },
  list: { gap: theme.space[3], flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    backgroundColor: theme.colors.bg.surface1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.space[4],
  },
  rowText: { flex: 1, gap: 2 },
  envelopeName: { ...theme.typography.bodyStrong, fontSize: 17, lineHeight: 22, color: theme.colors.text.primary },
  envelopeHint: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },
  // The percentage is the main action on each row, so its field is large and uses the display size.
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 128,
    height: 60,
    paddingHorizontal: theme.space[4],
    gap: theme.space[1],
    backgroundColor: theme.colors.bg.surface3,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  inputBoxFocused: { borderColor: theme.colors.brand.lime },
  input: { ...theme.typography.kpiLarge, flex: 1, textAlign: 'right', color: theme.colors.text.primary, padding: 0 },
  percent: { ...theme.typography.titleSection, color: theme.colors.text.secondary },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.default,
  },
  optionPressed: { opacity: 0.6 },
  optionName: { ...theme.typography.bodyStrong, color: theme.colors.text.primary },
  optionSub: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },

  muted: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary, textAlign: 'center' },
  error: { ...theme.typography.bodySecondary, color: theme.colors.status.error },
});
