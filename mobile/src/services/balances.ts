import { resolveAssetImageUrl } from '@/lib/asset-image';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/functions';
import type { Balance, SyncResult } from '@/types/database';

export async function listBalances(): Promise<Balance[]> {
  const { data, error } = await supabase
    .from('balances')
    .select('id, connection_id, asset, amount, last_synced_at, supported_assets(image_url)')
    .eq('delete_status', false);

  if (error) throw error;
  return (data as any[]).map(({ supported_assets, ...row }) => {
    const asset = Array.isArray(supported_assets) ? supported_assets[0] : supported_assets;
    return { ...row, amount: Number(row.amount), asset_icon_url: resolveAssetImageUrl(asset?.image_url) } as Balance;
  });
}

export function syncBalances() {
  return invokeFunction<SyncResult>('sync-balances');
}
