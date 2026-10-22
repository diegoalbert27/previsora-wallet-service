import { resolveAssetImageUrl } from '@/lib/asset-image';
import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/services/auth';
import type {
  Envelope,
  EnvelopeAllocation,
  EnvelopeBalance,
  EnvelopeUpdate,
  NewEnvelopeInput,
  SupportedAsset,
} from '@/types/database';

const COLUMNS = 'id, name, icon, target_amount, current_amount, asset, created_at';

// DECIMAL columns may arrive as strings.
function toEnvelope(row: any): Envelope {
  return {
    ...row,
    target_amount: row.target_amount === null ? null : Number(row.target_amount),
    current_amount: Number(row.current_amount ?? 0),
  };
}

/** Reads the `envelope_balances` view (scripts/database/views.sql), which runs with the caller's RLS. */
export async function getEnvelopes(): Promise<EnvelopeBalance[]> {
  const { data, error } = await supabase
    .from('envelope_balances')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  // NUMERIC columns may arrive as strings.
  return data.map((row) => ({
    ...row,
    allocated_amount: Number(row.allocated_amount),
  }));
}

export async function createEnvelope(input: NewEnvelopeInput): Promise<Envelope> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('envelopes')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      asset: input.asset,
      icon: input.icon,
    })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toEnvelope(data);
}

export async function listSupportedAssets(): Promise<(Pick<SupportedAsset, 'symbol' | 'asset_name'> & { icon_url: string | null })[]> {
  const { data, error } = await supabase
    .from('supported_assets')
    .select('symbol, asset_name, image_url')
    .eq('is_active', true)
    .eq('delete_status', false)
    .order('symbol');

  if (error) throw error;
  return data.map(({ image_url, ...asset }) => ({ ...asset, icon_url: resolveAssetImageUrl(image_url) }));
}

/** Sum of what every envelope has allocated, from the `envelope_balances` view. */
export async function getTotalAllocated(): Promise<number> {
  // Summed here rather than with PostgREST's sum() aggregate, which is disabled by default.
  const { data, error } = await supabase.from('envelope_balances').select('allocated_amount');

  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.allocated_amount), 0);
}

/** Breakdown of each envelope's balance by funding source, from the `envelope_allocations` view. */
export async function getEnvelopeAllocations(): Promise<EnvelopeAllocation[]> {
  const { data, error } = await supabase.from('envelope_allocations').select('*');

  if (error) throw error;
  // NUMERIC columns may arrive as strings.
  return data
    .map((row) => ({ ...row, percentage: Number(row.percentage), allocated_amount: Number(row.allocated_amount) }))
    .sort((a, b) => b.allocated_amount - a.allocated_amount);
}

export async function updateEnvelope(id: string, update: EnvelopeUpdate): Promise<void> {
  const { data, error } = await supabase
    .from('envelopes')
    .update({ name: update.name.trim(), icon: update.icon, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  if (error) throw error;
  // RLS filters rows silently instead of failing, so an empty result means nothing was updated.
  if (data.length === 0) throw new Error('Envelope not found.');
}

/**
 * Hard delete. The envelope's rules go with it (`rules.target_envelope_id` is ON DELETE CASCADE), which frees the
 * percentages it was receiving; execution logs are kept with their rule set to NULL.
 */
export async function deleteEnvelope(id: string): Promise<void> {
  const { data, error } = await supabase.from('envelopes').delete().eq('id', id).select('id');

  if (error) throw error;
  if (data.length === 0) throw new Error('Envelope not found.');
}
