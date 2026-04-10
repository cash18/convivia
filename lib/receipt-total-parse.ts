/**
 * Estrae un importo in euro (numero decimale) da testo OCR di uno scontrino.
 * Preferisce righe con parole chiave (TOTALE, IMPORTO, PAGARE…), altrimenti il massimo plausibile.
 */
const KEYWORD =
  /totale|importo|pagare|da\s+pagare|saldo|contanti|eur|euro|€|pagamento|ammontare|subtotale|balance|amount\s+due/i;

const EURO_NUMBER = /\b(\d{1,5}(?:[.,]\d{1,2})?)\b/g;

function parseEuroToken(raw: string): number | null {
  const t = raw.replace(",", ".").trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = parseFloat(t);
  if (Number.isNaN(n) || n < 0 || n > 100_000) return null;
  return n;
}

function collectFromLine(line: string): number[] {
  const found: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(EURO_NUMBER.source, "gi");
  while ((m = re.exec(line)) !== null) {
    const v = parseEuroToken(m[1] ?? "");
    if (v !== null) found.push(v);
  }
  return found;
}

export function extractEuroTotalFromReceiptText(text: string): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let bestKeyword: number | null = null;

  for (const line of lines) {
    if (!KEYWORD.test(line)) continue;
    const nums = collectFromLine(line);
    for (const n of nums) {
      if (bestKeyword === null || n > bestKeyword) bestKeyword = n;
    }
  }
  if (bestKeyword !== null) return bestKeyword;

  const all: number[] = [];
  for (const line of lines) {
    all.push(...collectFromLine(line));
  }
  if (all.length === 0) return null;
  return Math.max(...all);
}
