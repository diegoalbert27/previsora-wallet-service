export type ConnectionType = 'CEX' | 'ONCHAIN_WALLET' | 'COLD_WALLET';

export interface SupportedAsset {
  symbol: string;
  asset_name: string;
  asset_type: string;
  image_url: string | null;
  is_active: boolean;
}

export interface Connection {
  id: string;
  connection_type: ConnectionType;
  provider: string;
  network: string | null;
  public_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Balance {
  id: string;
  connection_id: string;
  asset: string;
  amount: number;
  last_synced_at: string;
}

export interface NewConnectionInput {
  connection_type: ConnectionType;
  provider: string;
  network?: string;
  public_address?: string;
  api_key?: string;
  api_secret?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  assets: string[];
  connections: number;
  skipped: { connection_id: string; connection_type: string; provider: string; network: string | null }[];
  errors: { connection_id: string; error: string }[];
}

export interface Envelope {
  id: string;
  name: string;
  target_amount: number | null;
  current_amount: number;
  asset: string;
  created_at: string;
}

/** A row of the `envelope_balances` view: the share of the user's total liquidity assigned to an envelope. */
export interface EnvelopeBalance {
  envelope_id: string;
  name: string;
  /** Sum of the envelope's active rule percentages (0–100). */
  percentage: number;
  /** Total balances × percentage / 100, in USD. */
  allocated_amount: number;
  created_at: string;
}

/** Share of the user's liquidity routed to an envelope. */
export interface RuleInput {
  envelope_id: string;
  percentage: number;
}

export interface NewEnvelopeInput {
  name: string;
  asset: string;
}
