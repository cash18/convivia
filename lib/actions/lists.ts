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
  return {};
}
