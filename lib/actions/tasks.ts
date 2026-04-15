"use server";

import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
import { createTranslator } from "@/lib/i18n/server";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";
import { createTaskCalendarEvent, setTaskLinkedCalendarCancelled } from "@/lib/task-calendar";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assertMember(houseId: string, userId: string) {
  const m = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return !!m;
}

export async function createTask(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const assigneeRaw = String(formData.get("assigneeId") ?? "").trim();
  const assigneeId = assigneeRaw === "" ? null : assigneeRaw;
  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  let dueDate: Date | null = null;
  if (dueRaw) {
    dueDate = new Date(dueRaw);
    if (Number.isNaN(dueDate.getTime())) dueDate = null;
  }

  const syncCalendar = formData.get("syncCalendar") === "on";
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  let durationMinutes = parseInt(durationRaw, 10);
  if (Number.isNaN(durationMinutes) || durationRaw === "") durationMinutes = 0;

  if (!title) return { error: await ta("errors.taskTitleRequired") };
  if (syncCalendar && !dueDate) return { error: await ta("errors.taskCalendarNeedsDue") };

  if (assigneeId) {
    const ok = await prisma.houseMember.findFirst({
      where: { houseId, userId: assigneeId },
    });
    if (!ok) return { error: await ta("errors.assigneeInvalid") };
  }

  const task = await prisma.task.create({
    data: {
      houseId,
      title,
      description,
      assigneeId,
      dueDate,
      status: "TODO",
      createdById: session.user.id,
    },
  });

  if (syncCalendar && dueDate) {
    const { t } = await createTranslator();
    let endsAt: Date | null = null;
    if (durationMinutes > 0) {
      const capped = Math.min(durationMinutes, 24 * 60 * 7);
      endsAt = new Date(dueDate.getTime() + capped * 60_000);
    }
    const reminderLine = t("tasksPage.calendarEventReminderLine");
    const calDesc = [description, reminderLine].filter(Boolean).join("\n\n") || reminderLine;
    await createTaskCalendarEvent({
      houseId,
      taskId: task.id,
      title,
      description: calDesc,
      startsAt: dueDate,
      endsAt,
      createdById: session.user.id,
      assigneeId,
    });
  }

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  const assignHint = assigneeId ? await ta("push.taskAssignSuffix") : "";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "TASKS",
    title: await ta("pushTitles.newTask"),
    body: formatMessage(await ta("push.taskCreated"), { who, title, assignHint }),
    path: `/casa/${houseId}/compiti`,
    tag: `convivia-task-${houseId}`,
  });
  return {};
}

export async function setTaskStatus(
  houseId: string,
  taskId: string,
  status: "TODO" | "DONE",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId },
  });
  if (!task) return { error: await ta("errors.taskNotFound") };

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  await setTaskLinkedCalendarCancelled(taskId, status === "DONE");

  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  if (status === "DONE") {
    const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
    void notifyHouseMembersExceptActor({
      houseId,
      actorUserId: session.user.id,
      category: "TASKS",
      title: await ta("pushTitles.taskCompleted"),
      body: formatMessage(await ta("push.taskCompleted"), { who, title: task.title }),
      path: `/casa/${houseId}/compiti`,
      tag: `convivia-task-done-${houseId}`,
    });
  }
  return {};
}

export async function deleteTask(houseId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId },
  });
  if (!task) return { error: await ta("errors.taskNotFound") };

  const title = task.title;
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}/calendario`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "TASKS",
    title: await ta("pushTitles.taskDeleted"),
    body: formatMessage(await ta("push.taskRemoved"), { who, title }),
    path: `/casa/${houseId}/compiti`,
    tag: `convivia-task-del-${houseId}`,
  });
  return {};
}
