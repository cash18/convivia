"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseEuroToCents } from "@/lib/money";
import { revalidatePath } from "next/cache";

async function assertMember(houseId: string, userId: string) {
  const m = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return !!m;
}

export async function createExpense(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const title = String(formData.get("title") ?? "").trim();
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const paidById = String(formData.get("paidById") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!title) return { error: "Titolo obbligatorio." };
  if (amountCents === null || amountCents <= 0) return { error: "Importo non valido." };
  if (!paidById) return { error: "Chi ha pagato?" };
  if (participantIds.length === 0) return { error: "Seleziona almeno un partecipante alla ripartizione." };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: participantIds } },
  });
  if (members.length !== participantIds.length) return { error: "Partecipanti non validi." };

  const n = participantIds.length;
  const each = Math.floor(amountCents / n);
  const remainder = amountCents - each * n;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        houseId,
        title,
        amountCents,
        paidById,
        notes,
        expenseDate: new Date(),
      },
    });
    for (let i = 0; i < participantIds.length; i++) {
      const uid = participantIds[i]!;
      const share = each + (i === participantIds.length - 1 ? remainder : 0);
      await tx.expenseSplit.create({
        data: { expenseId: expense.id, userId: uid, shareCents: share },
      });
    }
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function deleteExpense(houseId: string, expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const exp = await prisma.expense.findFirst({
    where: { id: expenseId, houseId },
  });
  if (!exp) return { error: "Spesa non trovata." };

  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
