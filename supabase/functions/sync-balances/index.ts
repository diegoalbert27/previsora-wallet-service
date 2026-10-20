import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptApiKey } from "../shared/crypto.ts";
import { getBinanceBalances } from "./providers/binance.ts";
import { EVM_NETWORKS, getEthereumBalances } from "./providers/ethereum.ts";

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    const { data: assets, error: assetsError } = await supabaseClient
      .from('supported_assets')
      .select('symbol')
      .eq('is_active', true)
      .eq('delete_status', false);

    if (assetsError) throw assetsError;

    const allowedAssets = assets.map((a) => a.symbol);

    const { data: connections, error: connectionsError } = await supabaseClient
      .from('connections')
      .select('id, connection_type, provider, network, public_address, encrypted_api_key, encrypted_api_secret')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('delete_status', false);

    if (connectionsError) throw connectionsError;

    const fetchBalances = async (connection: any): Promise<Record<string, number> | null> => {
      if (connection.connection_type === 'CEX' && connection.provider === 'BINANCE') {
        const apiKey = await decryptApiKey(connection.encrypted_api_key);
        const apiSecret = await decryptApiKey(connection.encrypted_api_secret);
        return await getBinanceBalances(apiKey, apiSecret, allowedAssets);
      }

      if (connection.connection_type === 'ONCHAIN_WALLET' && connection.network in EVM_NETWORKS) {
        return await getEthereumBalances(connection.public_address, allowedAssets, connection.network);
      }

      return null;
    };

    const results = await Promise.allSettled(connections.map(fetchBalances));

    const syncedAt = new Date().toISOString();
    const rows: any[] = [];
    const errors: { connection_id: string; error: string }[] = [];
    const skipped: { connection_id: string; connection_type: string; provider: string; network: string | null }[] = [];

    results.forEach((result, i) => {
      const connectionId = connections[i].id;

      if (result.status === 'rejected') {
        errors.push({ connection_id: connectionId, error: String(result.reason?.message ?? result.reason) });
        return;
      }

      if (!result.value) {
        const { connection_type, provider, network } = connections[i];
        skipped.push({ connection_id: connectionId, connection_type, provider, network });
        return;
      }

      for (const [asset, amount] of Object.entries(result.value)) {
        rows.push({
          connection_id: connectionId,
          user_id: user.id,
          asset,
          amount,
          last_synced_at: syncedAt,
        });
      }
    });

    if (rows.length > 0) {
      const { error: upsertError } = await adminClient
        .from('balances')
        .upsert(rows, { onConflict: 'connection_id,asset' });

      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({
      success: true,
      synced: rows.length,
      assets: allowedAssets,
      connections: connections.length,
      skipped,
      errors,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
