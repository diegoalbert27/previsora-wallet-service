import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAlchemyNetwork, updateAlchemyWebhookAddresses } from "../shared/alchemy.ts";

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

    const { connection_id } = await req.json();
    if (!connection_id) throw new Error('Missing connection_id');

    const { data: connection, error: findError } = await supabaseClient
      .from('connections')
      .select('id, connection_type, network, public_address')
      .eq('id', connection_id)
      .maybeSingle();

    if (findError) throw findError;
    if (!connection) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), { status: 404 });
    }

    const { error: deleteError } = await adminClient
      .from('connections')
      .delete()
      .eq('id', connection.id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    let webhookSynced: boolean | null = null;
    if (connection.connection_type === 'ONCHAIN_WALLET' && connection.public_address && isAlchemyNetwork(connection.network)) {
      const { count, error: countError } = await adminClient
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('network', connection.network)
        .ilike('public_address', connection.public_address);

      if (countError) {
        console.error('Could not check remaining uses of the address; leaving it in the webhook', countError);
      } else if (count === 0) {
        webhookSynced = await updateAlchemyWebhookAddresses(connection.network, {
          add: [],
          remove: [connection.public_address],
        });
      }
    }

    return new Response(JSON.stringify({ success: true, webhookSynced }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
