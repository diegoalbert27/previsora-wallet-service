import { useCallback, useState } from 'react';
import { syncBalances } from '@/services/balances';
import type { SyncResult } from '@/types/database';

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncBalances();
      setLastResult(result);
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { sync, syncing, lastResult, error };
}
