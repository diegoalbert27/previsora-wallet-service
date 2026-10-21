import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/services/auth';
import type { Envelope, EnvelopeBalance, NewEnvelopeInput, SupportedAsset } from '@/types/database';

const COLUMNS = 'id, name, target_amount, current_amount, asset, created_at';

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
    percentage: Number(row.percentage),
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
    })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toEnvelope(data);
}

export async function listSupportedAssets(): Promise<Pick<SupportedAsset, 'symbol' | 'asset_name'>[]> {
  const { data, error } = await supabase
    .from('supported_assets')
    .select('symbol, asset_name')
    .eq('is_active', true)
    .eq('delete_status', false)
    .order('symbol');

  if (error) throw error;
  return data;
}
