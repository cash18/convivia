"use server";

import { auth } from "@/auth";
import { MAX_RECEIPT_BYTES, MAX_RECEIPT_DATA_URL_CHARS } from "@/lib/expense-receipt-limits";
import { centsFromIntegerPercents } from "@/lib/percent-split";
import { formatEuroFromCents, parseEuroToCents } from "@/lib/money";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assertMember(houseId: string, userId: string) {
  const m = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return !!m;
}

async function readReceiptUrl(formData: FormData): Promise<{ receiptUrl: string | null; error?: string }> {
  const file = formData.get("receipt");
  if (!file || typeof file === "string") return { receiptUrl: null };
  if (!(file instanceof Blob) || file.size === 0) return { receiptUrl: null };
  if (file.size > MAX_RECEIPT_BYTES) {
    return {
      receiptUrl: null,
      error: "Lo scontrino supera 20 MB. Riduci la risoluzione o comprimi l’immagine.",
    };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = (file as File).type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return { receiptUrl: null, error: "L’allegato deve essere un’immagine (es. foto scontrino)." };
  }
  const b64 = buf.toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;
  if (dataUrl.length > MAX_RECEIPT_DATA_URL_CHARS) {
    return { receiptUrl: null, error: "Immagine troppo grande dopo la codifica. Usa una foto più piccola." };
  }
  return { receiptUrl: dataUrl };
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
  const splitMode = String(formData.get("splitMode") ?? "EQUAL") === "PERCENT" ? "PERCENT" : "EQUAL";

  if (!title) return { error: "Titolo obbligatorio." };
  if (amountCents === null || amountCents <= 0) return { error: "Importo non valido." };
  if (!paidById) return { error: "Chi ha pagato?" };
  if (participantIds.length === 0) return { error: "Seleziona almeno un partecipante alla ripartizione." };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: participantIds } },
  });
  if (members.length !== participantIds.length) return { error: "Partecipanti non validi." };

  const receiptRead = await readReceiptUrl(formData);
  if (receiptRead.error) return { error: receiptRead.error };
  const receiptUrl = receiptRead.receiptUrl;

  let shareCentsList: number[];
  let sharePercents: (number | null)[];

  if (splitMode === "PERCENT") {
    const percents = participantIds.map((id) => {
      const v = parseInt(String(formData.get(`pct_${id}`) ?? ""), 10);
      return Number.isFinite(v) ? v : NaN;
    });
    if (percents.some((p) => Number.isNaN(p) || p < 0 || p > 100)) {
      return { error: "Ogni percentuale deve essere un numero tra 0 e 100." };
    }
    const sum = percents.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      return { error: `Le percentuali devono sommare a 100% (attualmente ${sum}%).` };
    }
    try {
      shareCentsList = centsFromIntegerPercents(amountCents, percents);
    } catch {
      return { error: "Ripartizione percentuale non valida." };
    }
    sharePercents = percents;
  } else {
    const n = participantIds.length;
    const each = Math.floor(amountCents / n);
    const remainder = amountCents - each * n;
    shareCentsList = participantIds.map((_, i) => each + (i === participantIds.length - 1 ? remainder : 0));
    sharePercents = participantIds.map(() => null);
  }

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        houseId,
        title,
        amountCents,
        paidById,
        notes,
        splitMode,
        receiptUrl,
        expenseDate: new Date(),
      },
    });
    for (let i = 0; i < participantIds.length; i++) {
      const uid = participantIds[i]!;
      await tx.expenseSplit.create({
        data: {
          expenseId: expense.id,
          userId: uid,
          shareCents: shareCentsList[i]!,
          sharePercent: sharePercents[i] ?? null,
        },
      });
    }
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || "Qualcuno";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: "Nuova spesa",
    body: `${who} ha aggiunto «${title}» (${formatEuroFromCents(amountCents)}).`,
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-${houseId}`,
  });
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

  const title = exp.title;
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || "Qualcuno";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: "Spesa eliminata",
    body: `${who} ha rimosso «${title}».`,
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-del-${houseId}`,
  });
  return {};
}
