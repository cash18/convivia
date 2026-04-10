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

export async function createTask(
  houseId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

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

  if (!title) return { error: "Titolo obbligatorio." };

  if (assigneeId) {
    const ok = await prisma.houseMember.findFirst({
      where: { houseId, userId: assigneeId },
    });
    if (!ok) return { error: "Assegnatario non valido." };
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
  return {};
}

export async function setTaskStatus(
  houseId: string,
  taskId: string,
  status: "TODO" | "DONE",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId },
  });
  if (!task) return { error: "Compito non trovato." };

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function deleteTask(houseId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId },
  });
  if (!task) return { error: "Compito non trovato." };

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/casa/${houseId}/compiti`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
