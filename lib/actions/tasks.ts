"use server";

import { auth } from "@/auth";
import { formatMessage } from "@/lib/i18n/format-message";
import { ta } from "@/lib/i18n/action-messages";
import { notifyHouseMembersExceptActor } from "@/lib/push-notify";
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

  if (!title) return { error: await ta("errors.taskTitleRequired") };

  if (assigneeId) {
    const ok = await prisma.houseMember.findFirst({
      where: { houseId, userId: assigneeId },
    });
    if (!ok) return { error: await ta("errors.assigneeInvalid") };
  }

  await prisma.task.create({
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

  revalidatePath(`/casa/${houseId}/compiti`);
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
  revalidatePath(`/casa/${houseId}/compiti`);
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
