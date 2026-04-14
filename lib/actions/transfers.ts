"use server";

import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const amountCents = parseEuroToCents(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fromUserId || !toUserId) return { error: await ta("errors.transferUsersRequired") };
  if (fromUserId === toUserId) return { error: await ta("errors.transferSameUser") };
  if (amountCents === null || amountCents <= 0) return { error: await ta("errors.transferAmountInvalid") };

  const members = await prisma.houseMember.findMany({
    where: { houseId, userId: { in: [fromUserId, toUserId] } },
  });
  if (members.length !== 2) return { error: await ta("errors.transferUsersInvalid") };

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

  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  const detail = `${fromName?.name ?? "?"} → ${toName?.name ?? "?"} · ${formatEuroFromCents(amountCents)}`;
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "EXPENSES",
    title: await ta("pushTitles.transfer"),
    body: formatMessage(await ta("push.moneyTransfer"), { who, detail }),
    path: `/casa/${houseId}/spese`,
    tag: `convivia-transfer-${houseId}`,
  });
  return {};
}

export async function deleteMoneyTransfer(houseId: string, transferId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const row = await prisma.moneyTransfer.findFirst({
    where: { id: transferId, houseId },
  });
  if (!row) return { error: await ta("errors.transferNotFound") };

  await prisma.moneyTransfer.delete({ where: { id: transferId } });
  revalidatePath(`/casa/${houseId}/spese`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
