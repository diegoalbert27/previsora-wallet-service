import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/services/auth';
import type { RuleInput } from '@/types/database';

// The allocation screen manages one rule per envelope, triggered by new deposits.
const ALLOCATION_TRIGGER = 'ON_NEW_DEPOSIT';

export async function getRules(): Promise<RuleInput[]> {
  const { data, error } = await supabase
    .from('rules')
    .select('target_envelope_id, percentage_to_route')
    .eq('trigger_event', ALLOCATION_TRIGGER)
    .eq('is_active', true);

  if (error) throw error;
  // DECIMAL columns may arrive as strings.
  return data.map((row) => ({ envelope_id: row.target_envelope_id, percentage: Number(row.percentage_to_route) }));
}

/**
 * Saves the whole distribution in one request. Relies on the UNIQUE (target_envelope_id, trigger_event)
 * constraint in database.sql to update existing rules instead of duplicating them.
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
      percentage_to_route: rule.percentage,
      is_active: true,
      updated_at: now,
    })),
    { onConflict: 'target_envelope_id,trigger_event' },
  );

  if (error) throw error;
}
