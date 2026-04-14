/**
 * Estrae l'importo in euro dal testo OCR di uno scontrino.
 * Priorità: righe in basso, parole tipo TOTALE / DA PAGARE, importo in coda alla riga.
 */

/** Righe da escludere (subtotali, tasse, intestazioni). */
const EXCLUDE_LINE =
  /subtotale|sub-totale|imponibile|iva\s*(inc|ded|€|%|ordinaria)|sconto\s|sconti\s|documento|nr\.?\s*doc|cod\.?\s*fisc|partita\s*iva|tel\.|www\.|iban|banca|bancomat|operatore|cassa\s*\d|resto|pagamento\s*elettronico|transazione|auth\.?\s*code/i;

/** Forte indicazione di riga del totale da pagare (non subtotale). */
const STRONG_TOTAL_LINE =
  /\btotale\s*(eur|€|euro)?\b|\btot\.\s*(eur|€)?\b|importo\s*(a\s+)?pagare|da\s+pagare|ammontare|pagamento|importo\s+dovuto|totale\s+dovuto|balance\s+due|amount\s+due|vuelto|contanti|pagato\b|totale\s+a\s+pagare|tot\.\s+a\s+pagare|sum\s*total|grand\s*total|total\s*amount|you\s*pay|to\s*pay|amount\s*due/i;

/** Indicazione media (OCR spesso corrompe “totale”). */
const WEAK_TOTAL_LINE = /\b(tot|t0tale|tota1e|total|tatal)\b/i;

/** Evidenziazione tipografica spesso usata per il totale (grassetto simulato con simboli). */
const EMPHASIS_MARKS = /\*{2,}|#{2,}|={2,}|_{2,}/;

/** Importo a fine riga o dopo simbolo €. */
const NUM_WITH_OPTIONAL_SUFFIX = /\b(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:€|eur|euro)?\b/gi;
const EURO_PREFIX_AMOUNT = /(?:€|eur|euro)\s*(\d{1,5}(?:[.,]\d{1,2})?)/gi;

function normalizeOcrDigitLine(line: string): string {
  return line.replace(/[Oo]/g, (ch, i, s) => {
    const prev = s[i - 1] ?? "";
    const next = s[i + 1] ?? "";
    if (/\d/.test(prev) || /\d/.test(next)) return "0";
    return ch;
  });
}

function parseEuroToken(raw: string): number | null {
  const t = raw.replace(",", ".").trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = parseFloat(t);
  if (Number.isNaN(n) || n < 0 || n > 100_000) return null;
  return n;
}

function collectNumbersInLine(line: string): number[] {
  const normalized = normalizeOcrDigitLine(line);
  const found: number[] = [];
  let m: RegExpExecArray | null;
  const re1 = new RegExp(NUM_WITH_OPTIONAL_SUFFIX.source, "gi");
  while ((m = re1.exec(normalized)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;
    const v = parseEuroToken(raw);
    if (v !== null) found.push(v);
  }
  const re2 = new RegExp(EURO_PREFIX_AMOUNT.source, "gi");
  while ((m = re2.exec(normalized)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;
    const v = parseEuroToken(raw);
    if (v !== null) found.push(v);
  }
  return found;
}

/** Su righe di totale l'importo è spesso l'ultimo numero a destra. */
function pickAmountOnTotalLine(line: string): number | null {
  const nums = collectNumbersInLine(line);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0]!;
  return nums[nums.length - 1]!;
}

function lineEmphasisBonus(line: string): number {
  let b = 0;
  if (EMPHASIS_MARKS.test(line)) b += 3;
  if (/€|eur|euro/i.test(line)) b += 1;
  return b;
}

type Candidate = { value: number; score: number };

/**
 * Estrae il totale da un singolo blocco OCR, dando più peso alle ultime righe (fondo scontrino).
 */
export function extractEuroTotalFromReceiptText(text: string): number | null {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  const n = rawLines.length;
  const candidates: Candidate[] = [];

  for (let i = 0; i < n; i++) {
    const line = rawLines[i]!;
    if (EXCLUDE_LINE.test(line)) continue;

    const fromBottom = (i + 1) / n;
    const bottomWeight = 40 + Math.floor(fromBottom * 120);

    if (STRONG_TOTAL_LINE.test(line)) {
      const v = pickAmountOnTotalLine(line);
      if (v !== null) {
        const emphasis = lineEmphasisBonus(line);
        candidates.push({
          value: v,
          score: 1000 + bottomWeight + emphasis * 5,
        });
      }
    } else if (WEAK_TOTAL_LINE.test(line)) {
      const v = pickAmountOnTotalLine(line);
      if (v !== null && v >= 0.05) {
        candidates.push({
          value: v,
          score: 400 + bottomWeight + lineEmphasisBonus(line) * 3,
        });
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score || b.value - a.value);
    return candidates[0]!.value;
  }

  const bottomStart = Math.max(0, n - Math.min(28, Math.ceil(n * 0.5)));
  const bottomNums: number[] = [];
  for (let i = bottomStart; i < n; i++) {
    const line = rawLines[i]!;
    if (EXCLUDE_LINE.test(line)) continue;
    bottomNums.push(...collectNumbersInLine(line));
  }
  if (bottomNums.length > 0) {
    return Math.max(...bottomNums);
  }

  const all: number[] = [];
  for (const line of rawLines) {
    if (EXCLUDE_LINE.test(line)) continue;
    all.push(...collectNumbersInLine(line));
  }
  if (all.length === 0) return null;
  return Math.max(...all);
}

/**
 * True se nel testo compare almeno una riga che sembra il totale (OCR del fondo scontrino).
 */
export function hasLikelyTotalLine(text: string): boolean {
  return text.split(/\r?\n/).some((line) => {
    const l = line.trim();
    if (!l || EXCLUDE_LINE.test(l)) return false;
    return STRONG_TOTAL_LINE.test(l) || WEAK_TOTAL_LINE.test(l);
  });
}

export function extractEuroTotalFromDualOcr(bottomStripText: string, fullPageText: string): number | null {
  const b = extractEuroTotalFromReceiptText(bottomStripText);
  const f = extractEuroTotalFromReceiptText(fullPageText);

  if (!fullPageText.trim()) return b;
  if (!bottomStripText.trim()) return f;

  if (b === null) return f;
  if (f === null) return b;

  const diff = Math.abs(b - f);
  const scale = Math.max(b, f, 1);
  if (diff / scale <= 0.02) return b;

  const bottomHasStrong = STRONG_TOTAL_LINE.test(bottomStripText) || WEAK_TOTAL_LINE.test(bottomStripText);
  const fullHasStrong = STRONG_TOTAL_LINE.test(fullPageText) || WEAK_TOTAL_LINE.test(fullPageText);
  if (bottomHasStrong && !fullHasStrong) return b;
  if (fullHasStrong && !bottomHasStrong) return f;

  return Math.max(b, f);
}
