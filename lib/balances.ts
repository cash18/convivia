import { prisma } from "@/lib/prisma";

export type MemberBalance = {
  userId: string;
  name: string;
  paidCents: number;
  owedCents: number;
  balanceCents: number;
};

export async function computeMemberBalances(houseId: string): Promise<MemberBalance[]> {
  const members = await prisma.houseMember.findMany({
    where: { houseId },
    include: { user: { select: { id: true, name: true } } },
  });
  const [expenses, transfers] = await Promise.all([
    prisma.expense.findMany({
      where: { houseId },
      include: { splits: true },
    }),
    prisma.moneyTransfer.findMany({ where: { houseId } }),
  ]);

  const agg: Record<string, { paid: number; owed: number }> = {};
  for (const m of members) {
    agg[m.userId] = { paid: 0, owed: 0 };
  }

  for (const e of expenses) {
    if (agg[e.paidById]) agg[e.paidById]!.paid += e.amountCents;
    for (const s of e.splits) {
      if (agg[s.userId]) agg[s.userId]!.owed += s.shareCents;
    }
  }

  const transferDelta: Record<string, number> = {};
  for (const m of members) {
    transferDelta[m.userId] = 0;
  }
  for (const t of transfers) {
    if (transferDelta[t.fromUserId] !== undefined) transferDelta[t.fromUserId]! -= t.amountCents;
    if (transferDelta[t.toUserId] !== undefined) transferDelta[t.toUserId]! += t.amountCents;
  }

  return members.map((m) => {
    const a = agg[m.userId]!;
    const td = transferDelta[m.userId] ?? 0;
    return {
      userId: m.userId,
      name: m.user.name,
      paidCents: a.paid,
      owedCents: a.owed,
      balanceCents: a.paid - a.owed + td,
    };
  });
}
