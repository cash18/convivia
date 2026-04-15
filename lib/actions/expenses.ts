"use server";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { MAX_RECEIPT_BYTES, MAX_RECEIPT_DATA_URL_CHARS } from "@/lib/expense-receipt-limits";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
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
      error: await ta("errors.receiptTooBig"),
    };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mimeRaw = ((file as File).type || "image/jpeg").split(";")[0]?.trim().toLowerCase() ?? "image/jpeg";
  const allowedReceiptMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowedReceiptMimes.has(mimeRaw)) {
    return { receiptUrl: null, error: await ta("errors.receiptNotImage") };
  }
  const mime = mimeRaw;
  const b64 = buf.toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;
  if (dataUrl.length > MAX_RECEIPT_DATA_URL_CHARS) {
    return { receiptUrl: null, error: await ta("errors.receiptEncodeTooBig") };
  }
  return { receiptUrl: dataUrl };
}

function hasNewReceiptFile(formData: FormData): boolean {
  const file = formData.get("receipt");
  return !!(file && file instanceof Blob && file.size > 0);
}

type ResolvedSplits =
  | { error: string }
  | {
      splitMode: "EQUAL" | "PERCENT" | "CUSTOM";
      shareCentsList: number[];
      sharePercents: (number | null)[];
    };

async function resolveExpenseSplits(
  formData: FormData,
  amountCents: number,
  participantIds: string[],
): Promise<ResolvedSplits> {
  const raw = String(formData.get("splitMode") ?? "EQUAL").toUpperCase();
  const splitMode: "EQUAL" | "PERCENT" | "CUSTOM" =
    raw === "PERCENT" ? "PERCENT" : raw === "CUSTOM" ? "CUSTOM" : "EQUAL";

  if (splitMode === "PERCENT") {
    const percents = participantIds.map((id) => {
      const v = parseInt(String(formData.get(`pct_${id}`) ?? ""), 10);
      return Number.isFinite(v) ? v : NaN;
    });
    if (percents.some((p) => Number.isNaN(p) || p < 0 || p > 100)) {
      return { error: await ta("errors.percentRange") };
    }
    const sum = percents.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      return {
        error: formatMessage(await ta("errors.percentSumMust100"), { sum: String(sum) }),
      };
    }
    try {
      const shareCentsList = centsFromIntegerPercents(amountCents, percents);
      return { splitMode: "PERCENT", shareCentsList, sharePercents: percents };
    } catch {
      return { error: await ta("errors.percentInvalid") };
    }
  }

  if (splitMode === "CUSTOM") {
    const parsed = participantIds.map((id) => parseEuroToCents(String(formData.get(`eur_${id}`) ?? "")));
    if (parsed.some((c) => c === null || c < 0)) {
      return { error: await ta("errors.customAmountInvalid") };
    }
    const shareCentsList = parsed as number[];
    const sum = shareCentsList.reduce((a, b) => a + b, 0);
    if (sum !== amountCents) {
      return {
        error: formatMessage(await ta("errors.customSumMismatch"), {
          sum: formatEuroFromCents(sum),
          total: formatEuroFromCents(amountCents),
        }),
      };
    }
    return { splitMode: "CUSTOM", shareCentsList, sharePercents: participantIds.map(() => null) };
  }

  const n = participantIds.length;
  const each = Math.floor(amountCents / n);
  const remainder = amountCents - each * n;
  const shareCentsList = participantIds.map((_, i) => each + (i === participantIds.length - 1 ? remainder : 0));
  return { splitMode: "EQUAL", shareCentsList, sharePercents: participantIds.map(() => null) };
}

async function writeExpenseSplits(
  tx: Prisma.TransactionClient,
  expenseId: string,
  participantIds: string[],
  shareCentsList: number[],
  sharePercents: (number | null)[],
) {
  for (let i = 0; i < participantIds.length; i++) {
    const uid = participantIds[i]!;
    await tx.expenseSplit.create({
      data: {
        expenseId,
        userId: uid,
        shareCents: shareCentsList[i]!,
        sharePercent: sharePercents[i] ?? null,
      },
    });
  }
}

export async function createExpense(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const title = String(formData.get("title") ?? "").trim();
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const paidById = String(formData.get("paidById") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!title) return { error: await ta("errors.expenseTitleRequired") };
  if (amountCents === null || amountCents <= 0) return { error: await ta("errors.expenseAmountInvalid") };
  if (!paidById) return { error: await ta("errors.expensePaidByRequired") };
  if (participantIds.length === 0) return { error: await ta("errors.expenseParticipantsRequired") };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: participantIds } },
  });
  if (members.length !== participantIds.length) return { error: await ta("errors.expenseParticipantsInvalid") };

  const receiptRead = await readReceiptUrl(formData);
  if (receiptRead.error) return { error: receiptRead.error };
  const receiptUrl = receiptRead.receiptUrl;

  const resolved = await resolveExpenseSplits(formData, amountCents, participantIds);
  if ("error" in resolved) return { error: resolved.error };

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        houseId,
        title,
        amountCents,
        paidById,
        notes,
        splitMode: resolved.splitMode,
        receiptUrl,
        expenseDate: new Date(),
      },
    });
    await writeExpenseSplits(tx, expense.id, participantIds, resolved.shareCentsList, resolved.sharePercents);
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: await ta("pushTitles.newExpense"),
    body: formatMessage(await ta("push.expenseAdded"), {
      who,
      title,
      amount: formatEuroFromCents(amountCents),
    }),
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-${houseId}`,
  });
  return {};
}

/** Crea una spesa collegata a una lista spesa: rimuove le voci segnate come comprate; opzione chiudi lista. */
export async function createExpenseFromShoppingList(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const listId = String(formData.get("shoppingListId") ?? "").trim();
  const itemIds = [...new Set(formData.getAll("shoppingListItemId").map(String).filter(Boolean))];
  const completeList = formData.get("completeShoppingList") === "on";

  if (!listId) return { error: await ta("errors.listNotFound") };
  if (itemIds.length === 0) return { error: await ta("errors.shoppingListNoItemsSelected") };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId, completedAt: null },
    include: {
      items: {
        where: { id: { in: itemIds } },
      },
    },
  });
  if (!list) return { error: await ta("errors.listNotFound") };
  if (list.items.length !== itemIds.length) return { error: await ta("errors.shoppingListItemsInvalid") };
  if (list.items.some((i) => !i.done)) return { error: await ta("errors.shoppingListItemsNotChecked") };

  const title = String(formData.get("title") ?? "").trim();
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const paidById = String(formData.get("paidById") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!title) return { error: await ta("errors.expenseTitleRequired") };
  if (amountCents === null || amountCents <= 0) return { error: await ta("errors.expenseAmountInvalid") };
  if (!paidById) return { error: await ta("errors.expensePaidByRequired") };
  if (participantIds.length === 0) return { error: await ta("errors.expenseParticipantsRequired") };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: participantIds } },
  });
  if (members.length !== participantIds.length) return { error: await ta("errors.expenseParticipantsInvalid") };

  const receiptRead = await readReceiptUrl(formData);
  if (receiptRead.error) return { error: receiptRead.error };
  const receiptUrl = receiptRead.receiptUrl;

  const resolved = await resolveExpenseSplits(formData, amountCents, participantIds);
  if ("error" in resolved) return { error: resolved.error };

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        houseId,
        title,
        amountCents,
        paidById,
        notes,
        splitMode: resolved.splitMode,
        receiptUrl,
        expenseDate: new Date(),
      },
    });
    await writeExpenseSplits(tx, expense.id, participantIds, resolved.shareCentsList, resolved.sharePercents);
    await tx.shoppingListItem.deleteMany({ where: { id: { in: itemIds } } });
    if (completeList) {
      await tx.shoppingListItem.deleteMany({ where: { listId } });
      await tx.shoppingList.update({
        where: { id: listId },
        data: { completedAt: new Date() },
      });
    }
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: await ta("pushTitles.newExpense"),
    body: formatMessage(await ta("push.expenseAdded"), {
      who,
      title,
      amount: formatEuroFromCents(amountCents),
    }),
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-${houseId}`,
  });
  return {};
}

export async function updateExpense(
  houseId: string,
  expenseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, houseId },
  });
  if (!existing) return { error: await ta("errors.expenseNotFound") };

  const title = String(formData.get("title") ?? "").trim();
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const paidById = String(formData.get("paidById") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!title) return { error: await ta("errors.expenseTitleRequired") };
  if (amountCents === null || amountCents <= 0) return { error: await ta("errors.expenseAmountInvalid") };
  if (!paidById) return { error: await ta("errors.expensePaidByRequired") };
  if (participantIds.length === 0) return { error: await ta("errors.expenseParticipantsRequired") };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: [...participantIds, paidById] } },
  });
  if (members.length !== new Set([...participantIds, paidById]).size) {
    return { error: await ta("errors.expenseParticipantsInvalidEdit") };
  }

  let receiptUrl = existing.receiptUrl;
  if (hasNewReceiptFile(formData)) {
    const receiptRead = await readReceiptUrl(formData);
    if (receiptRead.error) return { error: receiptRead.error };
    if (receiptRead.receiptUrl) receiptUrl = receiptRead.receiptUrl;
  }

  const resolved = await resolveExpenseSplits(formData, amountCents, participantIds);
  if ("error" in resolved) return { error: resolved.error };

  await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId } });
    await tx.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amountCents,
        paidById,
        notes,
        splitMode: resolved.splitMode,
        receiptUrl,
      },
    });
    await writeExpenseSplits(tx, expenseId, participantIds, resolved.shareCentsList, resolved.sharePercents);
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: await ta("pushTitles.expenseUpdated"),
    body: formatMessage(await ta("push.expenseUpdated"), {
      who,
      title,
      amount: formatEuroFromCents(amountCents),
    }),
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-edit-${houseId}`,
  });
  return {};
}

export async function deleteExpense(houseId: string, expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const exp = await prisma.expense.findFirst({
    where: { id: expenseId, houseId },
  });
  if (!exp) return { error: await ta("errors.expenseNotFound") };

  const title = exp.title;
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: await ta("pushTitles.expenseDeleted"),
    body: formatMessage(await ta("push.expenseRemoved"), { who, title }),
    path: `/casa/${houseId}/spese`,
    tag: `convivia-expense-del-${houseId}`,
  });
  return {};
}
