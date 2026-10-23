import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listBalances } from '@/services/balances';
import { getTotalAllocated } from '@/services/envelopes';
import { useConnections } from '@/providers/connections-provider';
import type { Balance, Connection } from '@/types/database';

export interface ConnectionShare {
  connectionId: string;
  label: string;
  amount: number;
}

export interface AssetTotal {
  asset: string;
  iconUrl: string | null;
  amount: number;
  byConnection: ConnectionShare[];
}

export function connectionLabel(c: Connection | undefined): string {
  if (!c) return 'Unknown connection';
  if (c.connection_type === 'CEX') return c.provider;
  const address = c.public_address ? `${c.public_address.slice(0, 6)}…${c.public_address.slice(-4)}` : '';
  return ['Wallet', c.network, address].filter(Boolean).join(' · ');
}

export function useBalances() {
  const { connections } = useConnections();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalAllocated, setTotalAllocated] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rows, allocated] = await Promise.all([listBalances(), getTotalAllocated().catch(() => null)]);
      setBalances(rows);
      setTotalAllocated(allocated);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const summary = useMemo(() => {
    const byId = new Map(connections.map((c) => [c.id, c]));
    const assets = new Map<string, AssetTotal>();

    for (const b of balances) {
      const entry = assets.get(b.asset) ?? { asset: b.asset, iconUrl: b.asset_icon_url, amount: 0, byConnection: [] };
      entry.amount += b.amount;
      entry.byConnection.push({
        connectionId: b.connection_id,
        label: connectionLabel(byId.get(b.connection_id)),
        amount: b.amount,
      });
      assets.set(b.asset, entry);
    }

    const assetTotals = [...assets.values()].sort((a, b) => b.amount - a.amount);
    for (const a of assetTotals) a.byConnection.sort((x, y) => y.amount - x.amount);

    const total = assetTotals.reduce((sum, a) => sum + a.amount, 0);
    const lastSyncedAt = balances.reduce<string | null>(
      (latest, b) => (latest === null || b.last_synced_at > latest ? b.last_synced_at : latest),
      null,
    );

    return { assetTotals, total, lastSyncedAt };
  }, [balances, connections]);

  return { ...summary, totalAllocated, loading, error, refresh };
}
