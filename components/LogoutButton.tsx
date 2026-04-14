"use client";

import { useI18n } from "@/components/I18nProvider";
import { signOut } from "next-auth/react";

async function removePushSubscription(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => void removePushSubscription().finally(() => signOut({ callbackUrl: "/" }))}
      className="cv-btn-ghost py-1.5 text-xs sm:py-2 sm:text-sm"
    >
      {t("common.logout")}
    </button>
  );
}
