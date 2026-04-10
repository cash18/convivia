"use server";

import { auth } from "@/auth";
import {
  PUSH_NOTIFY_CATEGORIES,
  normalizePushNotifyPrefs,
  type PushNotifyCategory,
} from "@/lib/push-categories";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function savePushNotificationPreferences(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const prefs: Record<PushNotifyCategory, boolean> = normalizePushNotifyPrefs(null);
  for (const k of PUSH_NOTIFY_CATEGORIES) {
    prefs[k] = formData.get(k) === "1";
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushNotifyPrefs: prefs },
  });

  revalidatePath("/impostazioni");
}
