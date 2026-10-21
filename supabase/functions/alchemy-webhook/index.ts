import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEthereumBalances } from "../sync-balances/providers/ethereum.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    
    if (!body.event || !body.event.activity) {
      return new Response("Webhook configurado correctamente", { status: 200 });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const activities = body.event.activity;
    const affectedAddresses = new Set<string>();
    
    for (const tx of activities) {
      if (tx.fromAddress) affectedAddresses.add(tx.fromAddress.toLowerCase());
      if (tx.toAddress) affectedAddresses.add(tx.toAddress.toLowerCase());
    }

    const { data: connections, error: connError } = await adminClient
      .from('connections')
      .select('id, user_id, network, public_address')
      .eq('connection_type', 'ONCHAIN_WALLET')
      .eq('is_active', true)
      .eq('delete_status', false)
      .in('public_address', Array.from(affectedAddresses)); // ¡Búsqueda masiva eficiente!

    if (connError) throw connError;
    if (!connections || connections.length === 0) {
      return new Response("Wallets no pertenecen a ningún usuario", { status: 200 });
    }

    const { data: assets, error: assetsError } = await adminClient
      .from('supported_assets')
      .select('symbol')
      .eq('is_active', true)
      .eq('delete_status', false);

    if (assetsError) throw assetsError;

    const allowedAssets = assets.map((a) => a.symbol);
    const syncedAt = new Date().toISOString();
    const rowsToUpsert: any[] = [];

    for (const conn of connections) {
      const balances = await getEthereumBalances(conn.public_address, allowedAssets, conn.network);
      
      for (const [asset, amount] of Object.entries(balances)) {
        rowsToUpsert.push({
          connection_id: conn.id,
          user_id: conn.user_id,
          asset,
          amount,
          last_synced_at: syncedAt,
        });
      }
    }

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await adminClient
        .from('balances')
        .upsert(rowsToUpsert, { onConflict: 'connection_id,asset' });

      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ success: true, updated_connections: connections.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Error procesando webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
