export const EVM_NETWORKS: Record<string, Record<string, string>> = {
    'ETHEREUM': {
        'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7'
    },
    'SEPOLIA': {
        'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    }
};

export async function getEthereumBalances(publicAddress: string, allowedAssets: string[], network: string): Promise<Record<string, number>> {
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
    if (!alchemyKey) throw new Error("Falta ALCHEMY_API_KEY en los secretos");

    const rpcUrl = network === 'SEPOLIA' 
        ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
        : `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;

    const result: Record<string, number> = {};
    const networkContracts = EVM_NETWORKS[network] || {};

    for (const asset of allowedAssets) {
        if (asset === 'ETH') {
            const res = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [publicAddress, "latest"] })
            });
            const data = await res.json();
            result[asset] = Number(BigInt(data.result)) / 1e18;
        } 
        else if (networkContracts[asset]) {
            const contractAddress = networkContracts[asset];
            const cleanAddress = publicAddress.replace('0x', '').padStart(64, '0');
            const dataPayload = `0x70a08231${cleanAddress}`;

            const res = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: "2.0", id: 1, method: "eth_call",
                    params: [{ to: contractAddress, data: dataPayload }, "latest"]
                })
            });
            const data = await res.json();
            
            if (data.result && data.result !== '0x') {
                result[asset] = Number(BigInt(data.result)) / 1e6;
            } else {
                result[asset] = 0;
            }
        }
    }

    return result;
}
