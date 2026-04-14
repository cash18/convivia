"use server";

import { randomBytes } from "node:crypto";

import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite-code";
import { revalidatePath } from "next/cache";

function newCalendarFeedToken(): string {
  return randomBytes(24).toString("hex");
}

export async function createHouse(name: string): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  const trimmed = name.trim();
  if (!trimmed) return { error: await ta("errors.houseNameRequired") };

  let code = generateInviteCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const clash = await prisma.house.findUnique({ where: { inviteCode: code } });
    if (!clash) break;
    code = generateInviteCode();
  }

  const house = await prisma.house.create({
    data: {
      name: trimmed,
      inviteCode: code,
      calendarFeedToken: newCalendarFeedToken(),
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });
  revalidatePath("/case");
  return { id: house.id };
}

export async function joinHouse(
  inviteCode: string,
): Promise<{ ok: true; houseId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  const code = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4) return { error: await ta("errors.houseCodeInvalid") };

  const house = await prisma.house.findUnique({
    where: { inviteCode: code },
  });
  if (!house) return { error: await ta("errors.houseNotFound") };

  const already = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: session.user.id, houseId: house.id } },
  });

  await prisma.houseMember.upsert({
    where: { userId_houseId: { userId: session.user.id, houseId: house.id } },
    create: { userId: session.user.id, houseId: house.id, role: "MEMBER" },
    update: {},
  });
  revalidatePath("/case");
  if (!already) {
    const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
    void notifyHouseMembersExceptActor({
      houseId: house.id,
      actorUserId: session.user.id,
      category: "HOUSE",
      title: await ta("pushTitles.newMember"),
      body: formatMessage(await ta("push.memberJoined"), { who, houseName: house.name }),
      path: `/casa/${house.id}`,
      tag: `convivia-join-${house.id}`,
    });
  }
  return { ok: true, houseId: house.id };
}
