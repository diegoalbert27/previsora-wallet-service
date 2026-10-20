import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptApiKey } from "../shared/crypto.ts";
import { isAlchemyNetwork, updateAlchemyWebhookAddresses } from "../shared/alchemy.ts";

const SUPPORTED_NETWORKS = ['ETHEREUM', 'SEPOLIA'];

const normalize = (value: unknown) => String(value ?? '').trim().toUpperCase();

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) throw new Error('Unauthorized');

    const { connection_type, provider, network, public_address, api_key, api_secret } = await req.json();

    const normalizedProvider = normalize(provider);
    if (!normalizedProvider) throw new Error('Missing provider');

    const insertPayload: any = {
      user_id: user.id,
      connection_type,
      provider: normalizedProvider,
    };

    if (connection_type === 'CEX') {
      if (!api_key || !api_secret) throw new Error('Missing CEX credentials');
      insertPayload.encrypted_api_key = await encryptApiKey(api_key);
      insertPayload.encrypted_api_secret = await encryptApiKey(api_secret);
      
    } else if (connection_type === 'ONCHAIN_WALLET' || connection_type === 'COLD_WALLET') {
      if (!public_address || !network) throw new Error('Missing Wallet details');

      const normalizedNetwork = normalize(network);
      if (!SUPPORTED_NETWORKS.includes(normalizedNetwork)) throw new Error(`Unsupported network: ${network}`);

      insertPayload.public_address = String(public_address).trim();
      insertPayload.network = normalizedNetwork;
    } else {
        throw new Error('Invalid connection type');
    }

    const { data, error: insertError } = await supabaseClient
      .from('connections')
      .insert([insertPayload])
      .select('id')
      .single();

    if (insertError) 
      throw insertError;

    let webhookSynced: boolean | null = null;
    if (insertPayload.connection_type === 'ONCHAIN_WALLET' && isAlchemyNetwork(insertPayload.network)) {
      webhookSynced = await updateAlchemyWebhookAddresses(insertPayload.network, {
        add: [insertPayload.public_address],
        remove: [],
      });
    }

    return new Response(JSON.stringify({ success: true, connectionId: data.id, webhookSynced }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
