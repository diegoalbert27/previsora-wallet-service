const ALCHEMY_UPDATE_ADDRESSES_URL = 'https://dashboard.alchemy.com/api/update-webhook-addresses';
const REQUEST_TIMEOUT_MS = 8000;

export const ALCHEMY_NETWORKS = ['ETHEREUM', 'SEPOLIA'];

export const isAlchemyNetwork = (network: unknown): boolean =>
  typeof network === 'string' && ALCHEMY_NETWORKS.includes(network);

function webhookIdFor(network: string): string | undefined {
  return Deno.env.get(`ALCHEMY_WEBHOOK_ID_${network}`) ?? Deno.env.get('ALCHEMY_WEBHOOK_ID');
}

/**
 * Adds and/or removes addresses on the Alchemy webhook for `network`.
 *
 * Fail-safe by design: it never throws. The database is the source of truth, so a failure here
 * is only logged and reported through the returned boolean (true = Alchemy accepted the change).
 */
export async function updateAlchemyWebhookAddresses(
  network: string,
  changes: { add?: string[]; remove?: string[] },
): Promise<boolean> {
  try {
    const authToken = Deno.env.get('ALCHEMY_AUTH_TOKEN');
    const webhookId = webhookIdFor(network);
    if (!authToken || !webhookId) {
      throw new Error(`Missing ALCHEMY_AUTH_TOKEN or webhook id for ${network}`);
    }

    const response = await fetch(ALCHEMY_UPDATE_ADDRESSES_URL, {
      method: 'PATCH',
      headers: {
        'X-Alchemy-Token': authToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        addresses_to_add: changes.add ?? [],
        addresses_to_remove: changes.remove ?? [],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Alchemy responded ${response.status}: ${await response.text()}`);
    }

    return true;
  } catch (err) {
    console.error('Alchemy webhook update failed', { network, changes, error: (err as Error).message });
    return false;
  }
}
