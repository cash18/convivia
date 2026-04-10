"use server";

import { randomBytes } from "node:crypto";

import { auth } from "@/auth";
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

/** Rigenera il token del feed ICS (invalida i vecchi abbonamenti). Solo amministratore casa. */
export async function rotateHouseCalendarFeed(houseId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const member = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId: session.user.id, houseId } },
  });
  if (!member) return { error: "Accesso negato." };
  if (member.role !== "OWNER") {
    return { error: "Solo l’amministratore della casa può rigenerare il link del calendario." };
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
  return { error: "Impossibile rigenerare il token. Riprova." };
}
