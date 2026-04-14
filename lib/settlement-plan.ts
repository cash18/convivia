import type { MemberBalance } from "@/lib/balances";

export type SettlementStep = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountCents: number;
};

const CENT_EPS = 2;

/**
 * Piano di pareggio con **numero minimo di trasferimenti** (al più `n - 1` per `n` persone con saldo non nullo):
 * ad ogni passo si abbina chi deve di più con chi ha credito maggiore, fino a esaurire gli squilibri.
 * I saldi sono quelli già calcolati in `computeMemberBalances` (spese + trasferimenti registrati).
 */
export function computeMinimalSettlementPlan(balances: MemberBalance[]): SettlementStep[] {
  const runners = balances.map((b) => ({
    userId: b.userId,
    name: b.name,
    balance: b.balanceCents,
  }));
  const steps: SettlementStep[] = [];

  for (let guard = 0; guard < balances.length * balances.length + 8; guard++) {
    let debtorIdx = -1;
    let debtorBal = 0;
    for (let i = 0; i < runners.length; i++) {
      const b = runners[i]!.balance;
      if (b < -CENT_EPS && (debtorIdx < 0 || b < debtorBal)) {
        debtorIdx = i;
        debtorBal = b;
      }
    }

    let creditorIdx = -1;
    let creditorBal = 0;
    for (let i = 0; i < runners.length; i++) {
      const b = runners[i]!.balance;
      if (b > CENT_EPS && (creditorIdx < 0 || b > creditorBal)) {
        creditorIdx = i;
        creditorBal = b;
      }
    }

    if (debtorIdx < 0 || creditorIdx < 0) break;
    if (debtorIdx === creditorIdx) break;

    const d = runners[debtorIdx]!;
    const c = runners[creditorIdx]!;
    const pay = Math.min(-d.balance, c.balance);
    if (pay <= CENT_EPS) break;

    const amountCents = Math.round(pay);
    steps.push({
      fromUserId: d.userId,
      fromName: d.name,
      toUserId: c.userId,
      toName: c.name,
      amountCents,
    });

    d.balance += amountCents;
    c.balance -= amountCents;
  }

  return steps;
}
