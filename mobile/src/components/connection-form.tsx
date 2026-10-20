import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { useSync } from '@/hooks/use-sync';
import { addConnection } from '@/services/connections';
import { colors, radius, spacing } from '@/theme';
import type { NewConnectionInput } from '@/types/database';

type Kind = 'wallet' | 'binance';

const NETWORKS = ['ETHEREUM', 'SEPOLIA'] as const;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

interface ConnectionFormProps {
  /** Called once the connection exists and the first sync has finished (or the user dismissed its errors). */
  onDone: () => void | Promise<void>;
}

function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Text
          key={option}
          onPress={() => onChange(option)}
          style={[styles.segment, option === value && styles.segmentActive]}>
          {option}
        </Text>
      ))}
    </View>
  );
}

export function ConnectionForm({ onDone }: ConnectionFormProps) {
  const { sync } = useSync();
  const [kind, setKind] = useState<Kind>('wallet');
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>('SEPOLIA');
  const [address, setAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[] | null>(null);

  function buildInput(): NewConnectionInput | string {
    if (kind === 'wallet') {
      if (!ADDRESS_PATTERN.test(address.trim())) return 'Enter a valid address (0x followed by 40 hex characters).';
      return { connection_type: 'ONCHAIN_WALLET', provider: 'WALLET', network, public_address: address.trim() };
    }
    if (!apiKey.trim() || !apiSecret.trim()) return 'API key and secret are required.';
    return { connection_type: 'CEX', provider: 'BINANCE', api_key: apiKey.trim(), api_secret: apiSecret.trim() };
  }

  async function submit() {
    const input = buildInput();
    if (typeof input === 'string') {
      setError(input);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addConnection(input);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
      return;
    }

    const result = await sync();
    setSubmitting(false);

    const problems = result ? result.errors.map((e) => e.error) : ['Could not sync balances. You can retry from the Balances tab.'];
    if (problems.length > 0) {
      setSyncErrors(problems);
      return;
    }
    await onDone();
  }

  if (syncErrors) {
    return (
      <View style={styles.form}>
        <Text style={styles.heading}>Connection saved, but the sync had problems</Text>
        {syncErrors.map((message, i) => (
          <Text key={i} style={styles.errorBox}>
            {message}
          </Text>
        ))}
        <Button title="Continue" onPress={() => onDone()} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Segmented options={['wallet', 'binance'] as const} value={kind} onChange={setKind} />

      {kind === 'wallet' ? (
        <>
          <Text style={styles.label}>Network</Text>
          <Segmented options={NETWORKS} value={network} onChange={setNetwork} />
          <TextField label="Wallet address" placeholder="0x…" value={address} onChangeText={setAddress} />
        </>
      ) : (
        <>
          <Text style={styles.hint}>Use a read-only API key. Credentials are encrypted on the server.</Text>
          <TextField label="API key" value={apiKey} onChangeText={setApiKey} />
          <TextField label="API secret" secureTextEntry value={apiSecret} onChangeText={setApiSecret} />
        </>
      )}

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}
      <Button title="Connect and sync" onPress={submit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted },
  errorBox: { color: colors.danger, fontSize: 14 },
  segmented: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 2 },
  segment: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  segmentActive: { backgroundColor: colors.surface, color: colors.text },
});
