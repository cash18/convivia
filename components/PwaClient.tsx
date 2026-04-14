"use client";

import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

const DISMISS_KEY = "convivia_install_hint_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaClient() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    let storedDismissed = false;
    try {
      storedDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (storedDismissed) {
      setDismissed(true);
      return;
    }
    if (typeof window === "undefined" || isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos()) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        /* offline o dominio non idoneo */
      });
  }, []);

  function dismiss() {
    setDismissed(true);
    setInstallEvent(null);
    setShowIosHint(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function runInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (dismissed || isStandalone()) return null;

  if (installEvent) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] border-t border-emerald-200/80 bg-white/95 p-3 shadow-[0_-8px_30px_-10px_rgba(5,150,105,0.3)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        role="region"
        aria-label={t("pwa.ariaInstall")}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            <strong className="text-slate-900">{t("pwa.installStrong")}</strong> {t("pwa.installRest")}
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => void runInstall()} className="cv-btn-primary py-2 text-sm">
              {t("pwa.install")}
            </button>
            <button type="button" onClick={dismiss} className="cv-btn-ghost py-2 text-sm">
              {t("pwa.later")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] border-t border-emerald-200/80 bg-white/95 p-3 shadow-[0_-8px_30px_-10px_rgba(5,150,105,0.3)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        role="region"
        aria-label={t("pwa.ariaIos")}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            {t("pwa.iosBodyBefore")} <strong className="text-slate-900">{t("pwa.iosBodyDevice")}</strong>
            {t("pwa.iosBodyMid")} <strong className="text-slate-900">{t("pwa.iosShare")}</strong>{" "}
            <span className="whitespace-nowrap">(□↑)</span> {t("pwa.iosBodyAfter")}{" "}
            <strong className="text-slate-900">{t("pwa.iosAddHome")}</strong>.
          </p>
          <button type="button" onClick={dismiss} className="cv-btn-ghost shrink-0 self-end py-2 text-sm sm:self-auto">
            {t("pwa.ok")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
