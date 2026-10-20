const BINANCE_ACCOUNT_URL = 'https://testnet.binance.vision/api/v3/account';

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function signHmacSha256(secret: string, payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return toHex(signature);
}

export async function getBinanceBalances(
    apiKey: string,
    apiSecret: string,
    allowedAssets: string[]
): Promise<Record<string, number>> {
    const query = new URLSearchParams({
        timestamp: Date.now().toString(),
        recvWindow: '5000',
    }).toString();

    const signature = await signHmacSha256(apiSecret, query);

    const response = await fetch(`${BINANCE_ACCOUNT_URL}?${query}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey },
    });

    if (!response.ok) {
        throw new Error(`Binance API error ${response.status}: ${await response.text()}`);
    }

    const account: { balances: { asset: string; free: string; locked: string }[] } = await response.json();
    const result: Record<string, number> = Object.fromEntries(allowedAssets.map((asset) => [asset, 0]));

    for (const { asset, free, locked } of account.balances) {
        if (asset in result) {
            result[asset] = parseFloat(free) + parseFloat(locked);
        }
    }

    return result;
}
