"use server";

import { auth } from "@/auth";
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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome lista obbligatorio." };

  const list = await prisma.shoppingList.create({
    data: { houseId, name: trimmed },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || "Qualcuno";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: "Nuova lista spesa",
    body: `${who} ha creato la lista «${trimmed}».`,
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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: "Lista non trovata." };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome articolo obbligatorio." };

  await prisma.shoppingListItem.create({
    data: { listId, name: trimmed, addedById: session.user.id },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || "Qualcuno";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: "Lista spesa",
    body: `${who} ha aggiunto «${trimmed}» in «${list.name}».`,
    path: `/casa/${houseId}/liste`,
    tag: `convivia-listitem-${houseId}`,
  });
  return {};
}

export async function toggleListItem(houseId: string, itemId: string, done: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
  });
  if (!item) return { error: "Articolo non trovato." };

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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
  });
  if (!item) return { error: "Articolo non trovato." };

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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: "Lista non trovata." };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome obbligatorio." };

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
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, houseId },
  });
  if (!list) return { error: "Lista non trovata." };

  await prisma.shoppingList.delete({ where: { id: listId } });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  const who = session.user.name?.trim() || "Qualcuno";
  void notifyHouseMembersExceptActor({
    houseId,
    actorUserId: session.user.id,
    category: "LISTS",
    title: "Lista eliminata",
    body: `${who} ha eliminato la lista «${list.name}».`,
    path: `/casa/${houseId}/liste`,
    tag: `convivia-list-del-${houseId}`,
  });
  return {};
}

export async function updateShoppingListItem(
  houseId: string,
  itemId: string,
  name: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };
  if (!(await assertMember(houseId, session.user.id))) return { error: "Accesso negato." };

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { houseId } },
    include: { list: { select: { name: true } } },
  });
  if (!item) return { error: "Articolo non trovato." };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Testo obbligatorio." };

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { name: trimmed },
  });
  revalidatePath(`/casa/${houseId}/liste`);
  revalidatePath(`/casa/${houseId}`);
  return {};
}
