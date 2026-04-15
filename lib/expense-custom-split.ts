import { formatEuroNumberForInput, parseEuroToCents } from "@/lib/money";

/** Reparto in centesimi senza decimali fantasma (somma = totale). */
export function splitIntegerEqually(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const r = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < r ? 1 : 0));
}

/**
 * Mantiene i campi in `manual` come digitati; ripartisce il resto del totale
 * in parti uguali (in centesimi) tra i partecipanti spuntati non manuali.
 */
export function fillAutoCustomEuroFields(
  eur: Record<string, string>,
  manual: Set<string>,
  checkedIds: string[],
  allMemberIds: string[],
  totalCents: number,
): Record<string, string> {
  const out: Record<string, string> = { ...eur };
  for (const id of allMemberIds) {
    if (!checkedIds.includes(id)) out[id] = "";
  }
  const frozenIds = checkedIds.filter((id) => manual.has(id));
  const autoIds = checkedIds.filter((id) => !manual.has(id));
  let frozenSum = 0;
  for (const id of frozenIds) {
    const c = parseEuroToCents(eur[id] ?? "");
    frozenSum += c ?? 0;
  }
  let remainder = totalCents - frozenSum;
  if (remainder < 0) remainder = 0;
  if (autoIds.length === 0) return out;
  const parts = splitIntegerEqually(remainder, autoIds.length);
  autoIds.forEach((id, i) => {
    out[id] = formatEuroNumberForInput(parts[i]! / 100);
  });
  return out;
}

export function parseTotalEurosToCents(raw: string): number | null {
  const n = parseFloat(raw.replace(",", ".").trim());
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 100);
}
