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
  const expenses = await prisma.expense.findMany({
    where: { houseId },
    include: { splits: true },
  });

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

  return members.map((m) => {
    const a = agg[m.userId]!;
    return {
      userId: m.userId,
      name: m.user.name,
      paidCents: a.paid,
      owedCents: a.owed,
      balanceCents: a.paid - a.owed,
    };
  });
}
