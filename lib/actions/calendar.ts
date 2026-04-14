"use server";

import { randomBytes } from "node:crypto";

import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
import { canRotateCalendarFeed } from "@/lib/house-roles";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function newCalendarFeedToken(): string {
  return randomBytes(24).toString("hex");
}

async function assertMember(houseId: string, userId: string) {
  const m = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return !!m;
}

export async function createCalendarEvent(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();
  const allDay = formData.get("allDay") === "on";

  if (!title) return { error: await ta("errors.calendarTitleRequired") };
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return { error: await ta("errors.calendarInvalidStart") };
  let endsAt: Date | null = null;
  if (endsAtRaw) {
    endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime())) return { error: await ta("errors.calendarInvalidEnd") };
  }

  await prisma.calendarEvent.create({
    data: {
      houseId,
      title,
      description,
      startsAt,
      endsAt,
      allDay,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "CALENDAR",
    title: await ta("pushTitles.newCalendarEvent"),
    body: formatMessage(await ta("push.calendarAdd"), { who, title }),
    path: `/casa/${houseId}/calendario`,
    tag: `convivia-cal-${houseId}`,
  });
  return {};
}

/** Soft-delete: il feed ICS emette STATUS:CANCELLED così Google/Apple rimuovono l’evento dall’abbonamento. */
export async function deleteCalendarEvent(houseId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const ev = await prisma.calendarEvent.findFirst({
    where: { id: eventId, houseId, cancelledAt: null },
  });
  if (!ev) return { error: await ta("errors.eventNotFound") };

  const title = ev.title;
  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      cancelledAt: new Date(),
      calendarSequence: { increment: 1 },
    },
  });
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "CALENDAR",
    title: await ta("pushTitles.calendarEventDeleted"),
    body: formatMessage(await ta("push.calendarRemove"), { who, title }),
    path: `/casa/${houseId}/calendario`,
    tag: `convivia-cal-del-${houseId}`,
  });
  return {};
}

/** Rigenera il token del feed ICS (invalida i vecchi abbonamenti). Solo amministratore casa. */
export async function rotateHouseCalendarFeed(houseId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };

  const member = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: session.user.id, houseId } },
  });
  if (!member) return { error: await ta("errors.accessDenied") };
  if (!canRotateCalendarFeed(member.role)) {
    return { error: await ta("errors.onlyOwnerRotatesCalendar") };
  }

  for (let i = 0; i < 8; i++) {
    const token = newCalendarFeedToken();
    try {
      await prisma.house.update({
        where: { id: houseId },
        data: { calendarFeedToken: token },
      });
      revalidatePath(`/casa/${houseId}/calendario`);
      return {};
    } catch {
      /* token collision */
    }
  }
  return { error: await ta("errors.tokenRotateFailed") };
}
