/**
 * Converte percentuali intere (somma 100) in quote in centesimi che sommano esattamente a totalCents.
 */
export function centsFromIntegerPercents(totalCents: number, percents: number[]): number[] {
  if (percents.length === 0) return [];
  const sumP = percents.reduce((a, b) => a + b, 0);
  if (sumP !== 100) throw new Error("Le percentuali devono sommare a 100.");

  const n = percents.length;
  const floors = percents.map((p) => Math.floor((totalCents * p) / 100));
  let rem = totalCents - floors.reduce((a, b) => a + b, 0);
  const out = [...floors];
  // distribuisci i centesimi residui ai partecipanti con quota percentuale maggiore (o in ordine)
  const order = [...percents.map((p, i) => ({ i, p }))].sort((a, b) => b.p - a.p).map((x) => x.i);
  let k = 0;
  while (rem > 0 && order.length) {
    const idx = order[k % order.length]!;
    out[idx] = (out[idx] ?? 0) + 1;
    rem--;
    k++;
  }
  return out;
}
