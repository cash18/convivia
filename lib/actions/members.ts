"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  HouseRole,
  canManageHouseMembers,
  canPromoteSupervisor,
  canRemoveMember,
  isOwnerRole,
} from "@/lib/house-roles";
import { newSecureToken } from "@/lib/crypto-token";
import { sendTransactionalEmail } from "@/lib/email";
import { houseInviteEmailContent, ownershipTransferEmailContent } from "@/lib/email-messages";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";

async function membership(houseId: string, userId: string) {
  return prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
    include: { house: { select: { id: true, name: true } } },
  });
}

export async function inviteHouseMemberByEmail(
  houseId: string,
  emailRaw: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  const parsed = z.string().email().safeParse(emailRaw.trim().toLowerCase());
  if (!parsed.success) return { error: "Email non valida." };
  const email = parsed.data;

  const m = await membership(houseId, session.user.id);
  if (!m || !canManageHouseMembers(m.role)) return { error: "Non hai i permessi per invitare." };

  const already = await prisma.houseMember.findFirst({
    where: { houseId, user: { email } },
  });
  if (already) return { error: "Questa persona è già nella casa." };

  const token = newSecureToken();
  await prisma.houseEmailInvite.create({
    data: {
      houseId,
      email,
      invitedByUserId: session.user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const inviterName = session.user.name?.trim() || session.user.email || "Un coinquilino";
  const content = houseInviteEmailContent({
    token,
    houseName: m.house.name,
    inviterName,
  });
  const sent = await sendTransactionalEmail({
    to: email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    devPreviewUrl: content.previewUrl,
  });
  if (!sent.ok) return { error: "Invio email non riuscito. Riprova più tardi." };

  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function acceptHouseEmailInvite(
  token: string,
): Promise<{ ok: true; houseId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Devi accedere." };

  const inv = await prisma.houseEmailInvite.findUnique({
    where: { token: token.trim() },
    include: { house: true },
  });
  if (!inv || inv.usedAt) return { error: "Invito non valido o già usato." };
  if (inv.expiresAt.getTime() < Date.now()) return { error: "Invito scaduto." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== inv.email.toLowerCase()) {
    return { error: "Accedi con l’indirizzo email a cui è stato inviato l’invito." };
  }

  const already = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: session.user.id, houseId: inv.houseId } },
  });

  await prisma.$transaction([
    prisma.houseMember.upsert({
      where: { userId_houseId: { userId: session.user.id, houseId: inv.houseId } },
      create: { userId: session.user.id, houseId: inv.houseId, role: HouseRole.MEMBER },
      update: {},
    }),
    prisma.houseEmailInvite.update({
      where: { id: inv.id },
      data: { usedAt: new Date() },
    }),
  ]);

  revalidatePath("/case");
  revalidatePath(`/casa/${inv.houseId}`);
  revalidatePath(`/casa/${inv.houseId}/membri`);

  if (!already) {
    const who = session.user.name?.trim() || "Qualcuno";
    void notifyHouseMembersExceptActor({
      houseId: inv.houseId,
      actorUserId: session.user.id,
      category: "HOUSE",
      title: "Nuovo membro",
      body: `${who} è entrato in «${inv.house.name}».`,
      path: `/casa/${inv.houseId}`,
      tag: `convivia-join-${inv.houseId}`,
    });
  }

  return { ok: true, houseId: inv.houseId };
}

export async function removeHouseMember(
  houseId: string,
  targetUserId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (targetUserId === session.user.id) return { error: "Per lasciare la casa serve un’uscita dedicata (in arrivo). Qui puoi solo rimuovere altri." };

  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: "Membro non trovato." };
  if (!canRemoveMember(actor.role, target.role)) {
    return { error: "Non hai i permessi per rimuovere questo membro." };
  }
  if (isOwnerRole(target.role)) {
    return { error: "Il proprietario non può essere rimosso. Trasferisci prima la proprietà." };
  }

  await prisma.houseMember.delete({
    where: { userId_houseId: { userId: targetUserId, houseId } },
  });

  revalidatePath(`/casa/${houseId}/membri`);
  revalidatePath("/case");
  revalidatePath(`/casa/${houseId}`);
  return { ok: true };
}

export async function promoteHouseSupervisor(
  houseId: string,
  targetUserId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: "Membro non trovato." };
  if (!canPromoteSupervisor(actor.role)) return { error: "Solo il proprietario può nominare un supervisionatore." };
  if (target.role !== HouseRole.MEMBER) return { error: "Puoi promuovere solo un membro standard." };

  await prisma.houseMember.update({
    where: { userId_houseId: { userId: targetUserId, houseId } },
    data: { role: HouseRole.SUPERVISOR },
  });
  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function demoteHouseSupervisor(
  houseId: string,
  targetUserId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: "Membro non trovato." };
  if (!canPromoteSupervisor(actor.role)) return { error: "Solo il proprietario può modificare i ruoli." };
  if (target.role !== HouseRole.SUPERVISOR) return { error: "Questo membro non è un supervisionatore." };

  await prisma.houseMember.update({
    where: { userId_houseId: { userId: targetUserId, houseId } },
    data: { role: HouseRole.MEMBER },
  });
  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function requestHouseOwnershipTransfer(
  houseId: string,
  toUserId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (toUserId === session.user.id) return { error: "Scegli un altro membro come nuovo proprietario." };

  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, toUserId);
  if (!actor || !target) return { error: "Membro non trovato." };
  if (!isOwnerRole(actor.role)) return { error: "Solo il proprietario può avviare un trasferimento." };

  await prisma.houseOwnershipTransfer.updateMany({
    where: { houseId, status: "PENDING" },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });

  const token = newSecureToken();
  const transfer = await prisma.houseOwnershipTransfer.create({
    data: {
      houseId,
      fromUserId: session.user.id,
      toUserId,
      token,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    include: {
      house: { select: { name: true } },
      fromUser: { select: { name: true, email: true } },
      toUser: { select: { email: true } },
    },
  });

  const fromName = transfer.fromUser.name?.trim() || transfer.fromUser.email || "Il proprietario";
  const content = ownershipTransferEmailContent({
    token,
    houseName: transfer.house.name,
    fromName,
  });
  const sent = await sendTransactionalEmail({
    to: transfer.toUser.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    devPreviewUrl: content.previewUrl,
  });
  if (!sent.ok) {
    await prisma.houseOwnershipTransfer.delete({ where: { id: transfer.id } });
    return { error: "Invio email non riuscito. Riprova più tardi." };
  }

  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function cancelHouseOwnershipTransfer(
  houseId: string,
  transferId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const t = await prisma.houseOwnershipTransfer.findFirst({
    where: { id: transferId, houseId, fromUserId: session.user.id, status: "PENDING" },
  });
  if (!t) return { error: "Richiesta non trovata o già chiusa." };

  await prisma.houseOwnershipTransfer.update({
    where: { id: transferId },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });
  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function acceptHouseOwnershipTransfer(
  token: string,
): Promise<{ ok: true; houseId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Devi accedere." };

  const t = await prisma.houseOwnershipTransfer.findUnique({
    where: { token: token.trim() },
    include: { house: { select: { id: true, name: true } } },
  });
  if (!t || t.status !== "PENDING") return { error: "Richiesta non valida o già gestita." };
  if (t.expiresAt.getTime() < Date.now()) return { error: "Richiesta scaduta." };
  if (t.toUserId !== session.user.id) return { error: "Questa richiesta è destinata a un altro account." };

  const ownerRow = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: t.fromUserId, houseId: t.houseId } },
  });
  if (!ownerRow || !isOwnerRole(ownerRow.role)) {
    return { error: "La situazione della casa è cambiata. Contatta i coinquilini." };
  }

  await prisma.$transaction([
    prisma.houseMember.update({
      where: { userId_houseId: { userId: t.fromUserId, houseId: t.houseId } },
      data: { role: HouseRole.MEMBER },
    }),
    prisma.houseMember.update({
      where: { userId_houseId: { userId: t.toUserId, houseId: t.houseId } },
      data: { role: HouseRole.OWNER },
    }),
    prisma.houseOwnershipTransfer.update({
      where: { id: t.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
    prisma.houseOwnershipTransfer.updateMany({
      where: { houseId: t.houseId, status: "PENDING", id: { not: t.id } },
      data: { status: "CANCELLED", respondedAt: new Date() },
    }),
  ]);

  revalidatePath("/case");
  revalidatePath(`/casa/${t.houseId}`);
  revalidatePath(`/casa/${t.houseId}/membri`);

  const who = session.user.name?.trim() || "Il nuovo proprietario";
  void notifyHouseMembersExceptActor({
    houseId: t.houseId,
    actorUserId: session.user.id,
    category: "HOUSE",
    title: "Nuovo proprietario",
    body: `${who} è ora amministratore di «${t.house.name}».`,
    path: `/casa/${t.houseId}/membri`,
    tag: `convivia-owner-${t.houseId}`,
  });

  return { ok: true, houseId: t.houseId };
}

export async function declineHouseOwnershipTransfer(
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Devi accedere." };

  const t = await prisma.houseOwnershipTransfer.findUnique({
    where: { token: token.trim() },
  });
  if (!t || t.status !== "PENDING") return { error: "Richiesta non valida." };
  if (t.toUserId !== session.user.id) return { error: "Questa richiesta è destinata a un altro account." };

  await prisma.houseOwnershipTransfer.update({
    where: { id: t.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  revalidatePath(`/casa/${t.houseId}/membri`);
  return { ok: true };
}
