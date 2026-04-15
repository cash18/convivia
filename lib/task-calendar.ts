import { prisma } from "@/lib/prisma";

export async function createTaskCalendarEvent(opts: {
  houseId: string;
  taskId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  createdById: string;
  assigneeId: string | null;
}): Promise<void> {
  await prisma.calendarEvent.create({
    data: {
      houseId: opts.houseId,
      title: opts.title,
      description: opts.description,
      startsAt: opts.startsAt,
      endsAt: opts.endsAt,
      allDay: false,
      createdById: opts.createdById,
      taskId: opts.taskId,
      participants: opts.assigneeId ? { create: [{ userId: opts.assigneeId }] } : undefined,
    },
  });
}

export async function setTaskLinkedCalendarCancelled(taskId: string, cancelled: boolean): Promise<void> {
  if (cancelled) {
    await prisma.calendarEvent.updateMany({
      where: { taskId, cancelledAt: null },
      data: { cancelledAt: new Date(), calendarSequence: { increment: 1 } },
    });
    return;
  }
  await prisma.calendarEvent.updateMany({
    where: { taskId, cancelledAt: { not: null } },
    data: { cancelledAt: null, calendarSequence: { increment: 1 } },
  });
}
