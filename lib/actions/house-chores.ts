"use server";

import { auth } from "@/auth";
import { parseDateKeyFromDatetimeLocal } from "@/lib/calendar-all-day";
import { replaceChoreCalendarEvents } from "@/lib/house-chores-calendar-sync";
import { ta } from "@/lib/i18n/action-messages";
import { createTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assertMember(houseId: string, userId: string) {
  const m = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return !!m;
}

function parseRotationOrder(raw: string): string[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export async function createHouseChore(houseId: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const everyDays = Math.max(1, Math.min(366, parseInt(String(formData.get("everyDays") ?? "7"), 10) || 7));
  const anchorRaw = String(formData.get("anchorDate") ?? "").trim();
  const anchorDay = parseDateKeyFromDatetimeLocal(`${anchorRaw}T00:00`);
  const syncCalendar = formData.get("syncCalendar") === "on";
  const rotationOrder = parseRotationOrder(String(formData.get("rotationOrder") ?? ""));

  if (!title) return { error: await ta("errors.choreTitleRequired") };
  if (!anchorDay) return { error: await ta("errors.choreAnchorInvalid") };
  if (rotationOrder.length < 2) return { error: await ta("errors.choreRotationMinTwo") };

  const allowed = new Set(
    (await prisma.houseMember.findMany({ where: { houseId }, select: { userId: true } })).map((m) => m.userId),
  );
  for (const uid of rotationOrder) {
    if (!allowed.has(uid)) return { error: await ta("errors.choreRotationMemberInvalid") };
  }

  const anchorDate = new Date(`${anchorDay}T12:00:00.000Z`);

  const chore = await prisma.houseChore.create({
    data: {
      houseId,
      title,
      description,
      everyDays,
      anchorDate,
      syncCalendar,
      createdById: session.user.id,
      members: {
        create: rotationOrder.map((userId, sortOrder) => ({ userId, sortOrder })),
      },
    },
  });

  const { t } = await createTranslator();
  await replaceChoreCalendarEvents(houseId, chore.id, t);

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function deleteHouseChore(houseId: string, choreId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const chore = await prisma.houseChore.findFirst({ where: { id: choreId, houseId } });
  if (!chore) return { error: await ta("errors.choreNotFound") };

  await prisma.houseChore.delete({ where: { id: choreId } });

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function swapChoreOccurrenceAssignee(
  houseId: string,
  choreId: string,
  occurrenceDateKey: string,
  newAssigneeId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const chore = await prisma.houseChore.findFirst({
    where: { id: choreId, houseId },
    include: { members: true },
  });
  if (!chore) return { error: await ta("errors.choreNotFound") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDateKey)) return { error: await ta("errors.choreOccurrenceInvalid") };

  const pool = new Set(chore.members.map((m) => m.userId));
  if (!pool.has(newAssigneeId)) return { error: await ta("errors.choreSwapAssigneeInvalid") };

  const occurrenceDate = new Date(`${occurrenceDateKey}T12:00:00.000Z`);

  await prisma.houseChoreSwap.upsert({
    where: {
      houseChoreId_occurrenceDate: { houseChoreId: choreId, occurrenceDate },
    },
    create: { houseChoreId: choreId, occurrenceDate, assigneeUserId: newAssigneeId },
    update: { assigneeUserId: newAssigneeId },
  });

  const { t } = await createTranslator();
  await replaceChoreCalendarEvents(houseId, choreId, t);

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

/** Form wrapper per `<form action={…}>` da Client Components. */
export async function houseChoreSwapFormAction(formData: FormData): Promise<void> {
  const houseId = String(formData.get("houseId") ?? "");
  const choreId = String(formData.get("choreId") ?? "");
  const occurrenceDateKey = String(formData.get("occurrenceDateKey") ?? "");
  const newAssigneeId = String(formData.get("newAssigneeId") ?? "");
  await swapChoreOccurrenceAssignee(houseId, choreId, occurrenceDateKey, newAssigneeId);
}

export async function houseChoreClearSwapFormAction(formData: FormData): Promise<void> {
  const houseId = String(formData.get("houseId") ?? "");
  const choreId = String(formData.get("choreId") ?? "");
  const occurrenceDateKey = String(formData.get("occurrenceDateKey") ?? "");
  await clearChoreOccurrenceSwap(houseId, choreId, occurrenceDateKey);
}

export async function houseChoreDeleteFormAction(formData: FormData): Promise<void> {
  const houseId = String(formData.get("houseId") ?? "");
  const choreId = String(formData.get("choreId") ?? "");
  await deleteHouseChore(houseId, choreId);
}

export async function clearChoreOccurrenceSwap(
  houseId: string,
  choreId: string,
  occurrenceDateKey: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const chore = await prisma.houseChore.findFirst({ where: { id: choreId, houseId } });
  if (!chore) return { error: await ta("errors.choreNotFound") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDateKey)) return { error: await ta("errors.choreOccurrenceInvalid") };

  const occurrenceDate = new Date(`${occurrenceDateKey}T12:00:00.000Z`);

  await prisma.houseChoreSwap.deleteMany({
    where: { houseChoreId: choreId, occurrenceDate },
  });

  const { t } = await createTranslator();
  await replaceChoreCalendarEvents(houseId, choreId, t);

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
