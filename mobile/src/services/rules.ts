import { resolveAssetImageUrl } from '@/lib/asset-image';
import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/services/auth';
import type { FundingSource, RuleInput } from '@/types/database';

const ALLOCATION_TRIGGER = 'ON_NEW_DEPOSIT';

export async function getRules(): Promise<RuleInput[]> {
  const { data, error } = await supabase
    .from('rules')
    .select('target_envelope_id, percentage_to_route, source_connection_id, source_asset')
    .eq('trigger_event', ALLOCATION_TRIGGER)
    .eq('is_active', true);

  if (error) throw error;

  return data.map((row) => ({
    envelope_id: row.target_envelope_id,
    percentage: Number(row.percentage_to_route),
    source_connection_id: row.source_connection_id,
    source_asset: row.source_asset,
  }));
}

/**
 * Saves a distribution in one request. Relies on the UNIQUE (target_envelope_id, source_connection_id,
 * source_asset, trigger_event) constraint in database.sql to update existing rules instead of duplicating them.
 */
export async function upsertRules(rulesData: RuleInput[]): Promise<void> {
  if (rulesData.length === 0) return;

  const userId = await requireUserId();
  const now = new Date().toISOString();

  const { error } = await supabase.from('rules').upsert(
    rulesData.map((rule) => ({
      user_id: userId,
      trigger_event: ALLOCATION_TRIGGER,
      target_envelope_id: rule.envelope_id,
      source_connection_id: rule.source_connection_id,
      source_asset: rule.source_asset,
      percentage_to_route: rule.percentage,
      is_active: true,
      updated_at: now,
    })),
    { onConflict: 'target_envelope_id,source_connection_id,source_asset,trigger_event' },
  );

  if (error) throw error;
}

/** Real balances (greater than zero) the user can allocate from, with the connection they live in. Largest first. */
export async function getFundingSources(): Promise<FundingSource[]> {
  const { data, error } = await supabase
    .from('balances')
    .select(
      'connection_id, asset, amount, connections(provider, network, connection_type, public_address), supported_assets(image_url)',
    )
    .eq('delete_status', false)
    .gt('amount', 0);

  if (error) throw error;

  return (data as any[])
    .flatMap((row) => {
      const connection = Array.isArray(row.connections) ? row.connections[0] : row.connections;
      if (!connection) return [];
      return [
        {
          connection_id: row.connection_id,
          connection_type: connection.connection_type,
          provider: connection.provider,
          network: connection.network,
          public_address: connection.public_address,
          asset: row.asset,
          icon_url: resolveAssetImageUrl((Array.isArray(row.supported_assets) ? row.supported_assets[0] : row.supported_assets)?.image_url),
          amount: Number(row.amount),
        } as FundingSource,
      ];
    })
    .sort((a, b) => b.amount - a.amount);
}
