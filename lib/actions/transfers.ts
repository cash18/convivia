"use server";

import { auth } from "@/auth";
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

export async function createMoneyTransfer(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fromUserId || !toUserId) return { error: "Seleziona mittente e destinatario." };
  if (fromUserId === toUserId) return { error: "Mittente e destinatario devono essere diversi." };
  if (amountCents === null || amountCents <= 0) return { error: "Importo non valido." };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: [fromUserId, toUserId] } },
  });
  if (members.length !== 2) return { error: "Utenti non validi per questa casa." };

  const fromName = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { name: true },
  });
  const toName = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { name: true },
  });

  await prisma.moneyTransfer.create({
    data: {
      houseId,
      fromUserId,
      toUserId,
      amountCents,
      note,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);

  const who = session.user.name?.trim() || "Qualcuno";
  const body = `${fromName?.name ?? "?"} → ${toName?.name ?? "?"} · ${formatEuroFromCents(amountCents)}`;
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: "Trasferimento",
    body: `${who} ha registrato un trasferimento: ${body}.`,
    path: `/casa/${houseId}/spese`,
    tag: `convivia-transfer-${houseId}`,
  });
  return {};
}

export async function deleteMoneyTransfer(houseId: string, transferId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const row = await prisma.moneyTransfer.findFirst({
    where: { id: transferId, houseId },
  });
  if (!row) return { error: "Trasferimento non trovato." };

  await prisma.moneyTransfer.delete({ where: { id: transferId } });
  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
