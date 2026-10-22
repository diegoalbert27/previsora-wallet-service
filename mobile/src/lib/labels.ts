interface SourceLike {
  connection_type: string;
  provider: string;
  network: string | null;
  public_address: string | null;
}

/** Human name of a funding source's connection: "BINANCE" or "Wallet · SEPOLIA · 0x14e6…b380". */
export function sourceName(s: SourceLike): string {
  if (s.connection_type === 'CEX') return s.provider;
  const address = s.public_address ? `${s.public_address.slice(0, 6)}…${s.public_address.slice(-4)}` : null;
  return ['Wallet', s.network, address].filter(Boolean).join(' · ');
}
