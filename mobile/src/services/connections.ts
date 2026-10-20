import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/functions';
import type { Connection, NewConnectionInput } from '@/types/database';

export async function listConnections(): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('id, connection_type, provider, network, public_address, is_active, created_at')
    .eq('delete_status', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export function addConnection(input: NewConnectionInput) {
  return invokeFunction<{ success: boolean; connectionId: string }>('add-connection', { ...input });
}

/**
 * Hard delete through the `remove-connection` Edge Function, which also removes the wallet address
 * from the Alchemy webhook. It wipes the encrypted API credentials too, and `balances.connection_id`
 * is ON DELETE CASCADE, so the connection's balances go with it.
 */
export async function deleteConnection(id: string): Promise<void> {
  await invokeFunction<{ success: boolean; webhookSynced: boolean | null }>('remove-connection', {
    connection_id: id,
  });
}
