"use client";

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

export function PushNotificationsClient() {
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
        setHint("Permesso negato. Abilita le notifiche per questo sito dalle impostazioni del browser.");
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
        throw new Error(j.error ?? "Errore salvataggio");
      }
      setSubscribed(true);
    } catch {
      setHint("Attivazione non riuscita. Controlla la connessione o riprova da app installata (PWA).");
    } finally {
      setBusy(false);
    }
  }, []);

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
      setHint("Disattivazione non riuscita.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (status !== "authenticated" || !vapidPublic || !pushSupported()) {
    return null;
  }

  if (!swReady) {
    return null;
  }

  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";

  return (
    <div className="flex min-w-0 max-w-[min(100%,18rem)] flex-col items-end gap-1 text-right">
      {subscribed ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900">
            <span aria-hidden>🔔</span>
            Notifiche attive
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void unsubscribe()}
            className="touch-manipulation text-xs font-medium text-slate-500 underline decoration-slate-300 transition hover:text-slate-800 active:opacity-60 active:decoration-slate-500 disabled:opacity-50"
          >
            Disattiva
          </button>
        </div>
      ) : denied ? (
        <p className="max-w-xs text-[11px] leading-snug text-amber-800">
          Notifiche bloccate dal browser. Sbloccale per questo sito nelle impostazioni.
        </p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void subscribe()}
          className="inline-flex touch-manipulation items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 active:scale-[0.97] active:bg-emerald-100 active:shadow-inner disabled:opacity-60"
        >
          <span aria-hidden>🔔</span>
          {busy ? "Attivazione…" : "Notifiche casa"}
        </button>
      )}
      {hint ? <p className="max-w-xs text-[11px] leading-snug text-red-700">{hint}</p> : null}
      <Link
        href="/impostazioni"
        className="touch-manipulation text-[11px] font-medium text-emerald-800 underline decoration-emerald-300 underline-offset-2 transition hover:text-emerald-950 active:opacity-60"
      >
        Categorie notifiche
      </Link>
    </div>
  );
}
