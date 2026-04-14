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

export async function createShoppingList(
  houseId: string,
  name: string,
): Promise<{ error?: string; listId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };
  const trimmed = name.trim();
  if (!trimmed) return { error: await ta("errors.listNameRequired") };

  const list = await prisma.shoppingList.create({
    data: { houseId, name: trimmed },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: await ta("pushTitles.newList"),
    body: formatMessage(await ta("push.listCreated"), { who, listName: trimmed }),
    path: `/casa/${houseId}/liste`,
    tag: `convivia-list-${houseId}`,
  });
  return { listId: list.id };
}

export async function addListItem(
  houseId: string,
  listId: string,
  name: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: await ta("errors.listNotFound") };
  const trimmed = name.trim();
  if (!trimmed) return { error: await ta("errors.itemNameRequired") };

  await prisma.shoppingListItem.create({
    data: { listId, name: trimmed, addedById: session.user.id },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: await ta("pushTitles.listItem"),
    body: formatMessage(await ta("push.listItemAdded"), { who, item: trimmed, listName: list.name }),
    path: `/casa/${houseId}/liste`,
    tag: `convivia-listitem-${houseId}`,
  });
  return {};
}

export async function toggleListItem(houseId: string, itemId: string, done: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
  });
  if (!item) return { error: await ta("errors.itemNotFound") };

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { done },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function deleteListItem(houseId: string, itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
  });
  if (!item) return { error: await ta("errors.itemNotFound") };

  await prisma.shoppingListItem.delete({ where: { id: itemId } });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function updateShoppingList(
  houseId: string,
  listId: string,
  name: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: await ta("errors.listNotFound") };
  const trimmed = name.trim();
  if (!trimmed) return { error: await ta("errors.nameRequired") };

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { name: trimmed },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function deleteShoppingList(houseId: string, listId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: await ta("errors.listNotFound") };

  await prisma.shoppingList.delete({ where: { id: listId } });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || (await ta("push.fallbackActor"));
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: await ta("pushTitles.listDeleted"),
    body: formatMessage(await ta("push.listDeleted"), { who, listName: list.name }),
    path: `/casa/${houseId}/liste`,
    tag: `convivia-list-del-${houseId}`,
  });
  return {};
}

export async function reopenShoppingList(houseId: string, listId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: await ta("errors.listNotFound") };

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { completedAt: null },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}

export async function updateShoppingListItem(
  houseId: string,
  itemId: string,
  name: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: await ta("errors.notAuthenticated") };
  if (!(await assertMember(houseId, session.user.id))) return { error: await ta("errors.accessDenied") };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
    include: { list: { select: { name: true } } },
  });
  if (!item) return { error: await ta("errors.itemNotFound") };
  const trimmed = name.trim();
  if (!trimmed) return { error: await ta("errors.textRequired") };

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { name: trimmed },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
