import webpush from "web-push";

import type { PushNotifyCategory } from "@/lib/push-categories";
import { userAcceptsPushCategory } from "@/lib/push-categories";
import { prisma } from "@/lib/prisma";

export type HousePushPayload = {
  houseId: string;
  /** Utente che ha compiuto l’azione: non riceve la notifica. */
  actorUserId: string;
  /** Usato con le preferenze profilo (`User.pushNotifyPrefs`). */
  category: PushNotifyCategory;
  title: string;
  body: string;
  /** Path in-app, es. `/casa/xyz/spese` */
  path: string;
  /** Raggruppa notifiche simili (stessa casa + tipo). */
  tag?: string;
};

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:notify@convivia.app";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Invia una notifica push a tutti i membri della casa tranne chi ha agito.
 * Non blocca: da chiamare con `void` dopo mutazioni riuscite.
 */
export async function notifyHouseMembersExceptActor(payload: HousePushPayload): Promise<void> {
  if (!ensureVapid()) return;

  const house = await prisma.house.findUnique({
    where: { id: payload.houseId },
    select: {
      name: true,
      members: { select: { userId: true } },
    },
  });
  if (!house) return;

  const recipientIds = house.members.map((m) => m.userId).filter((id) => id !== payload.actorUserId);
  if (recipientIds.length === 0) return;

  const subs = await prisma.webPushSubscription.findMany({
    where: { userId: { in: recipientIds } },
    include: { user: { select: { pushNotifyPrefs: true } } },
  });
  const subsFiltered = subs.filter((s) =>
    userAcceptsPushCategory(s.user.pushNotifyPrefs, payload.category),
  );
  if (subsFiltered.length === 0) return;

  const body = `${house.name}: ${payload.body}`;
  const data = JSON.stringify({
    title: payload.title,
    body,
    path: payload.path,
    tag: payload.tag ?? `convivia-${payload.houseId}`,
  });

  await Promise.all(
    subsFiltered.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          data,
          { TTL: 86_400, urgency: "normal" },
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await prisma.webPushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        }
      }
    }),
  );
}
