"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();
  const allDay = formData.get("allDay") === "on";

  if (!title) return { error: "Titolo obbligatorio." };
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return { error: "Data/ora inizio non valida." };
  let endsAt: Date | null = null;
  if (endsAtRaw) {
    endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime())) return { error: "Data/ora fine non valida." };
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
  return {};
}

export async function deleteCalendarEvent(houseId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const ev = await prisma.calendarEvent.findFirst({
    where: { id: eventId, houseId },
  });
  if (!ev) return { error: "Evento non trovato." };

  await prisma.calendarEvent.delete({ where: { id: eventId } });
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
