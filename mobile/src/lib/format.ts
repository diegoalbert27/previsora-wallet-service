/** Splits an amount in 3 decimals so the fraction can be rendered smaller than the integer part. */
export function splitTotal(n: number): { whole: string; fraction: string } {
  const parts = new Intl.NumberFormat(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).formatToParts(n);
  const decimalIndex = parts.findIndex((p) => p.type === 'decimal');
  const join = (items: Intl.NumberFormatPart[]) => items.map((p) => p.value).join('');
  return decimalIndex === -1
    ? { whole: join(parts), fraction: '' }
    : { whole: join(parts.slice(0, decimalIndex)), fraction: join(parts.slice(decimalIndex)) };
}
