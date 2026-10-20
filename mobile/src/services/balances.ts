import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/functions';
import type { Balance, SyncResult } from '@/types/database';

export async function listBalances(): Promise<Balance[]> {
  const { data, error } = await supabase
    .from('balances')
    .select('id, connection_id, asset, amount, last_synced_at')
    .eq('delete_status', false);

  if (error) throw error;
  // DECIMAL columns may arrive as strings.
  return data.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export function syncBalances() {
  return invokeFunction<SyncResult>('sync-balances');
}
