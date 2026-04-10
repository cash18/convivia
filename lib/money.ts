export function parseEuroToCents(input: string): number | null {
  const n = parseFloat(input.replace(",", ".").trim());
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Formato `12,34` per campi importo dopo OCR o calcoli. */
export function formatEuroNumberForInput(amount: number): string {
  return amount.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
