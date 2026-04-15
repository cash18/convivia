"use client";

import { useI18n } from "@/components/I18nProvider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState, startTransition } from "react";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
const PUSH_BANNER_DISMISSED_KEY = "casa_condivisa_push_banner_dismissed";

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

export function BellIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className ?? (filled ? "h-5 w-5 text-white" : "h-5 w-5 text-emerald-800")}
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

function useHousePush() {
  const { t } = useI18n();
  const { status } = useSession();
  const [swReady, setSwReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const eligible = status === "authenticated" && !!vapidPublic && pushSupported();

  useEffect(() => {
    if (!eligible) return;
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
  }, [eligible]);

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

  const toggle = useCallback(async () => {
    if (busy) return;
    setHint(null);
    const denied = typeof Notification !== "undefined" && Notification.permission === "denied";
    if (denied) {
      setHint(t("pushBell.blocked"));
      return;
    }
    if (subscribed) await unsubscribe();
    else await subscribe();
  }, [busy, subscribed, subscribe, unsubscribe, t]);

  return {
    eligible,
    swReady,
    subscribed,
    busy,
    hint,
    subscribe,
    unsubscribe,
    toggle,
    setHint,
  };
}

export function PushReminderBanner() {
  const { t } = useI18n();
  const { eligible, swReady, subscribed, busy, subscribe, hint } = useHousePush();
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setHydrated(true);
      try {
        setDismissed(localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1");
      } catch {
        setDismissed(false);
      }
    });
  }, []);

  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";

  if (!hydrated || !eligible || !swReady || subscribed || denied || dismissed) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(PUSH_BANNER_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  async function onEnable() {
    await subscribe();
  }

  return (
    <div className="border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 to-teal-50/90 px-[max(0.75rem,env(safe-area-inset-left,0px))] py-2.5 pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/80 bg-white/90 text-emerald-800 shadow-sm">
            <BellIcon filled={false} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-950">{t("pushBell.reminderTitle")}</p>
            <p className="text-xs leading-snug text-emerald-900/90">{t("pushBell.reminderBody")}</p>
            {hint ? <p className="mt-1 text-xs text-red-700">{hint}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onEnable()}
            className="cv-btn-primary touch-manipulation px-3 py-2 text-sm"
          >
            {busy ? t("pushBell.busyOn") : t("pushBell.reminderEnable")}
          </button>
          <button type="button" onClick={dismiss} className="touch-manipulation text-xs font-medium text-emerald-800 underline underline-offset-2">
            {t("pushBell.reminderDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationsClient({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { eligible, swReady, subscribed, busy, hint, toggle } = useHousePush();

  if (!eligible) {
    return null;
  }

  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";

  if (compact) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            disabled={busy || !swReady}
            onClick={() => void toggle()}
            title={
              denied
                ? t("pushBell.blocked")
                : subscribed
                  ? t("pushBell.ariaDisable")
                  : t("pushBell.ariaEnable")
            }
            aria-pressed={subscribed}
            aria-busy={busy}
            className={`relative flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full border-2 shadow-sm transition active:scale-95 disabled:opacity-60 ${
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
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-semibold text-slate-800">{t("nav.menuPush")}</span>
              {!swReady ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" aria-hidden />
                  {t("pushBell.menuLoading")}
                </span>
              ) : subscribed ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
                  {t("pushBell.menuOn")}
                </span>
              ) : denied ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
                  {t("pushBell.menuBlocked")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full border border-slate-400 bg-white" aria-hidden />
                  {t("pushBell.menuOff")}
                </span>
              )}
            </div>
            {swReady && !subscribed && !denied ? (
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{t("pushBell.menuEncourage")}</p>
            ) : null}
            {swReady && subscribed ? (
              <Link href="/impostazioni" className="mt-1 inline-block text-[11px] font-medium text-emerald-800 underline">
                {t("pushBell.categoriesLink")}
              </Link>
            ) : null}
          </div>
        </div>
        {hint ? <p className="text-[10px] leading-snug text-red-700">{hint}</p> : null}
      </div>
    );
  }

  if (!swReady) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      {!subscribed && !denied ? (
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
          onClick={() => void toggle()}
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
          <Link href="/impostazioni" className="hidden text-[11px] font-medium text-emerald-800 underline sm:inline">
            {t("pushBell.categoriesLink")}
          </Link>
        ) : null}
      </div>
      {hint ? <p className="max-w-[18rem] text-right text-[10px] leading-snug text-red-700">{hint}</p> : null}
    </div>
  );
}
