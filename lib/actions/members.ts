"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  const parsed = z.string().email().safeParse(emailRaw.trim().toLowerCase());
  if (!parsed.success) return { error: await ta("errors.emailInvalid") };
  const email = parsed.data;

  const m = await membership(houseId, session.user.id);
  if (!m || !canManageHouseMembers(m.role)) return { error: await ta("errors.noPermissionInvite") };

  const already = await prisma.houseMember.findFirst({
    where: { houseId, user: { email } },
  });
  if (already) return { error: await ta("errors.alreadyInHouse") };

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

  const inviterName =
    session.user.name?.trim() || session.user.email || (await ta("labels.inviterFallback"));
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
  if (!sent.ok) return { error: await ta("errors.emailSendFailed") };

  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function acceptHouseEmailInvite(
  token: string,
): Promise<{ ok: true; houseId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.mustSignIn") };

  const inv = await prisma.houseEmailInvite.findUnique({
    where: { token: token.trim() },
    include: { house: true },
  });
  if (!inv || inv.usedAt) return { error: await ta("errors.inviteInvalidOrUsed") };
  if (inv.expiresAt.getTime() < Date.now()) return { error: await ta("errors.inviteExpired") };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== inv.email.toLowerCase()) {
    return { error: await ta("errors.signInWithInviteEmail") };
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
    const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
    void notifyHouseMembersExceptActor({
      houseId: inv.houseId,
      actorUserId: session.user.id,
      category: "HOUSE",
      title: await ta("pushTitles.newMember"),
      body: formatMessage(await ta("push.memberJoined"), { who, houseName: inv.house.name }),
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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (targetUserId === session.user.id) return { error: await ta("errors.cannotRemoveSelf") };

  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: await ta("errors.memberNotFound") };
  if (!canRemoveMember(actor.role, target.role)) {
    return { error: await ta("errors.noPermissionRemove") };
  }
  if (isOwnerRole(target.role)) {
    return { error: await ta("errors.ownerCannotBeRemoved") };
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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: await ta("errors.memberNotFound") };
  if (!canPromoteSupervisor(actor.role)) return { error: await ta("errors.onlyOwnerPromotes") };
  if (target.role !== HouseRole.MEMBER) return { error: await ta("errors.onlyMemberCanPromote") };

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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, targetUserId);
  if (!actor || !target) return { error: await ta("errors.memberNotFound") };
  if (!canPromoteSupervisor(actor.role)) return { error: await ta("errors.onlyOwnerChangesRoles") };
  if (target.role !== HouseRole.SUPERVISOR) return { error: await ta("errors.notSupervisor") };

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
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (toUserId === session.user.id) return { error: await ta("errors.chooseOtherOwner") };

  const actor = await membership(houseId, session.user.id);
  const target = await membership(houseId, toUserId);
  if (!actor || !target) return { error: await ta("errors.memberNotFound") };
  if (!isOwnerRole(actor.role)) return { error: await ta("errors.onlyOwnerTransfers") };

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

  const fromName =
    transfer.fromUser.name?.trim() || transfer.fromUser.email || (await ta("labels.ownerFallback"));
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
    return { error: await ta("errors.emailSendFailed") };
  }

  revalidatePath(`/casa/${houseId}/membri`);
  return { ok: true };
}

export async function cancelHouseOwnershipTransfer(
  houseId: string,
  transferId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };

  const t = await prisma.houseOwnershipTransfer.findFirst({
    where: { id: transferId, houseId, fromUserId: session.user.id, status: "PENDING" },
  });
  if (!t) return { error: await ta("errors.transferNotFoundOrClosed") };

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
  if (!session?.user?.id) return { error: await ta("errors.mustSignIn") };

  const t = await prisma.houseOwnershipTransfer.findUnique({
    where: { token: token.trim() },
    include: { house: { select: { id: true, name: true } } },
  });
  if (!t || t.status !== "PENDING") return { error: await ta("errors.transferInvalidOrHandled") };
  if (t.expiresAt.getTime() < Date.now()) return { error: await ta("errors.transferExpired") };
  if (t.toUserId !== session.user.id) return { error: await ta("errors.transferWrongAccount") };

  const ownerRow = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: t.fromUserId, houseId: t.houseId } },
  });
  if (!ownerRow || !isOwnerRole(ownerRow.role)) {
    return { error: await ta("errors.houseChanged") };
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

  const who = session.user.name?.trim() || (await ta("labels.newOwnerFallback"));
  void notifyHouseMembersExceptActor({
    houseId: t.houseId,
    actorUserId: session.user.id,
    category: "HOUSE",
    title: await ta("pushTitles.newOwner"),
    body: formatMessage(await ta("push.ownerChanged"), { who, houseName: t.house.name }),
    path: `/casa/${t.houseId}/membri`,
    tag: `convivia-owner-${t.houseId}`,
  });

  return { ok: true, houseId: t.houseId };
}

export async function declineHouseOwnershipTransfer(
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.mustSignIn") };

  const t = await prisma.houseOwnershipTransfer.findUnique({
    where: { token: token.trim() },
  });
  if (!t || t.status !== "PENDING") return { error: await ta("errors.transferInvalid") };
  if (t.toUserId !== session.user.id) return { error: await ta("errors.transferWrongAccount") };

  await prisma.houseOwnershipTransfer.update({
    where: { id: t.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  revalidatePath(`/casa/${t.houseId}/membri`);
  return { ok: true };
}
