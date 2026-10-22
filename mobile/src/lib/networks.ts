export interface NetworkOption {
  /** Stored in connections.network; must match SUPPORTED_NETWORKS in the add-connection Edge Function. */
  value: string;
  label: string;
  description: string;
  /** Test network: its funds have no real value, so the UI flags it. */
  testnet?: boolean;
}

// Adding a network here is not enough: the backend must support it too (SUPPORTED_NETWORKS in add-connection,
// EVM_NETWORKS in sync-balances, and the Alchemy webhook for it).
export const NETWORKS: NetworkOption[] = [
  { value: 'ETHEREUM', label: 'Ethereum', description: 'Mainnet' },
  { value: 'SEPOLIA', label: 'Sepolia', description: 'Ethereum testnet', testnet: true },
];

export const networkOption = (value: string | null | undefined) => NETWORKS.find((network) => network.value === value);
