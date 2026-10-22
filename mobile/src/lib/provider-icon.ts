import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ConnectionType } from '@/types/database';

interface ProviderIconSource {
  url: string;
  /** For logos drawn in black, which would vanish on the dark UI. */
  tintColor?: string;
}

// Logos in the public `providers` bucket whose artwork is black on transparent.
const BLACK_LOGOS = new Set(['BLOCKCHAIN']);

/** Logo of the provider behind a connection: the exchange's own (BINANCE.svg) or the generic blockchain one for wallets. */
export function providerIcon(connection: { connection_type: ConnectionType; provider: string }): ProviderIconSource {
  const name = connection.connection_type === 'CEX' ? connection.provider.toUpperCase() : 'BLOCKCHAIN';
  const { data } = supabase.storage.from(env.providerIconsBucket).getPublicUrl(`${name}.svg`);
  return { url: data.publicUrl, tintColor: BLACK_LOGOS.has(name) ? '#FFFFFF' : undefined };
}
