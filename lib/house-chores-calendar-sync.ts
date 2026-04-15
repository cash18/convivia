import { formatMessage } from "@/lib/i18n/format-message";
import { addDaysToDateKey, minDateKey, utcCalendarDateKey } from "@/lib/calendar-all-day";
import { HOUSE_CHORE_MAX_OCCURRENCES } from "@/lib/house-chore-utils";
import { occurrenceDateKeysInRange, effectiveAssigneeUserId } from "@/lib/house-chore-utils";
import { prisma } from "@/lib/prisma";

const HORIZON_PAST_DAYS = 14;
const HORIZON_FUTURE_DAYS = 400;

type TFn = (key: string) => string;

export async function replaceChoreCalendarEvents(houseId: string, choreId: string, t: TFn): Promise<void> {
  const chore = await prisma.houseChore.findFirst({
    where: { id: choreId, houseId },
    include: {
      members: { orderBy: { sortOrder: "asc" }, include: { user: { select: { name: true } } } },
      swaps: true,
    },
  });
  if (!chore || !chore.syncCalendar) {
    await prisma.calendarEvent.deleteMany({ where: { houseChoreId: choreId } });
    return;
  }

  const membersOrdered = chore.members.map((m) => ({ userId: m.userId }));
  if (membersOrdered.length === 0) {
    await prisma.calendarEvent.deleteMany({ where: { houseChoreId: choreId } });
    return;
  }

  const today = new Date();
  const fromKey = addDaysToDateKey(utcCalendarDateKey(today), -HORIZON_PAST_DAYS);
  const horizonToKey = addDaysToDateKey(utcCalendarDateKey(today), HORIZON_FUTURE_DAYS);
  const recurrenceEndKey = utcCalendarDateKey(chore.recurrenceEndDate);
  const toKey = minDateKey(horizonToKey, recurrenceEndKey);
  const keys = occurrenceDateKeysInRange(chore.anchorDate, chore.everyDays, fromKey, toKey).slice(
    0,
    HOUSE_CHORE_MAX_OCCURRENCES,
  );

  const swapByKey = new Map<string, string>();
  for (const s of chore.swaps) {
    swapByKey.set(utcCalendarDateKey(s.occurrenceDate), s.assigneeUserId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.calendarEvent.deleteMany({ where: { houseChoreId: choreId } });

    for (const occurrenceKey of keys) {
      const assigneeId = effectiveAssigneeUserId(
        membersOrdered,
        chore.anchorDate,
        chore.everyDays,
        occurrenceKey,
        swapByKey.get(occurrenceKey),
      );
      if (!assigneeId) continue;
      const member = chore.members.find((m) => m.userId === assigneeId);
      const assigneeName = member?.user.name ?? "?";

      const title = formatMessage(t("houseChores.calendarEventTitle"), {
        choreTitle: chore.title,
        name: assigneeName,
      });
      const descParts = [
        formatMessage(t("houseChores.calendarEventBodyLine"), { name: assigneeName }),
        chore.description?.trim(),
      ].filter(Boolean);
      const description = descParts.join("\n\n") || null;

      const startsAt = new Date(`${occurrenceKey}T12:00:00.000Z`);
      const choreOccurrenceDate = new Date(`${occurrenceKey}T00:00:00.000Z`);

      await tx.calendarEvent.create({
        data: {
          houseId,
          title,
          description,
          startsAt,
          endsAt: null,
          allDay: true,
          createdById: chore.createdById,
          houseChoreId: choreId,
          choreOccurrenceDate,
          participants: { create: [{ userId: assigneeId }] },
        },
      });
    }
  });
}
