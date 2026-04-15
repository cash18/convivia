"use client";

import { useI18n } from "@/components/I18nProvider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={filled ? "h-5 w-5 text-white" : "h-5 w-5 text-emerald-800"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function PushNotificationsClient({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { status } = useSession();
  const [swReady, setSwReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !vapidPublic || !pushSupported()) return;
    void (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
        setSwReady(true);
      } catch {
        setSwReady(false);
      }
    })();
  }, [status]);

  const subscribe = useCallback(async () => {
    if (!vapidPublic) return;
    setBusy(true);
    setHint(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setHint(t("pushBell.hintDenied"));
        setBusy(false);
        return;
      }
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
      }
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subscription: json }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "err");
      }
      setSubscribed(true);
    } catch {
      setHint(t("pushBell.hintFailed"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setHint(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setHint(t("pushBell.hintOffFailed"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  async function onBellClick() {
    if (busy) return;
    setHint(null);
    const denied = typeof Notification !== "undefined" && Notification.permission === "denied";
    if (denied) {
      setHint(t("pushBell.blocked"));
      return;
    }
    if (subscribed) await unsubscribe();
    else await subscribe();
  }

  if (status !== "authenticated" || !vapidPublic || !pushSupported()) {
    return null;
  }

  if (!swReady) {
    return null;
  }

  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";

  return (
    <div
      className={`flex min-w-0 gap-1 ${compact ? "flex-row flex-wrap items-center" : "flex-col items-end sm:flex-row sm:items-center sm:gap-2"}`}
    >
      {!compact && !subscribed && !denied ? (
        <p className="max-w-[min(100%,18rem)] text-right text-[10px] leading-snug text-slate-600 sm:max-w-[20rem]">
          {t("pushBell.encourage")}{" "}
          <Link href="/impostazioni" className="cv-link font-medium whitespace-nowrap">
            {t("pushBell.categoriesLink")}
          </Link>
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onBellClick()}
          title={
            denied
              ? t("pushBell.blocked")
              : subscribed
                ? t("pushBell.ariaDisable")
                : t("pushBell.ariaEnable")
          }
          aria-pressed={subscribed}
          aria-busy={busy}
          className={`relative flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full border-2 shadow-sm transition active:scale-95 disabled:opacity-50 ${
            subscribed
              ? "border-emerald-500 bg-gradient-to-br from-emerald-600 to-green-600 shadow-emerald-600/25"
              : denied
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-300/80 bg-white/90 hover:border-emerald-400 hover:bg-emerald-50/90"
          }`}
        >
          <BellIcon filled={subscribed} />
          {busy ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/75 text-[10px] font-bold text-emerald-900">
              …
            </span>
          ) : null}
        </button>
        {subscribed ? (
          <Link
            href="/impostazioni"
            className={`text-[11px] font-medium text-emerald-800 underline ${compact ? "inline" : "hidden sm:inline"}`}
          >
            {t("pushBell.categoriesLink")}
          </Link>
        ) : null}
      </div>
      {hint ? (
        <p
          className={`text-[10px] leading-snug text-red-700 ${compact ? "max-w-full text-left" : "max-w-[18rem] text-right"}`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
