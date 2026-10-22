export type ConnectionType = 'CEX' | 'ONCHAIN_WALLET';

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
  asset_icon_url: string | null;
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
  icon: string | null;
  target_amount: number | null;
  current_amount: number;
  asset: string;
  created_at: string;
}

export interface EnvelopeBalance {
  envelope_id: string;
  name: string;
  icon: string | null;
  allocated_amount: number;
  created_at: string;
}

export interface EnvelopeAllocation {
  envelope_id: string;
  source_connection_id: string;
  asset: string;
  connection_type: ConnectionType;
  provider: string;
  network: string | null;
  public_address: string | null;
  percentage: number;
  allocated_amount: number;
}

export interface RuleInput {
  envelope_id: string;
  percentage: number;
  source_connection_id: string;
  source_asset: string;
}

export interface FundingSource {
  connection_id: string;
  connection_type: ConnectionType;
  provider: string;
  network: string | null;
  public_address: string | null;
  asset: string;
  icon_url: string | null;
  amount: number;
}

export interface NewEnvelopeInput {
  name: string;
  asset: string;
  icon: string;
}

export interface EnvelopeUpdate {
  name: string;
  icon: string;
}
