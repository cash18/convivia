"use client";

import { useI18n } from "@/components/I18nProvider";
import { rotateHouseCalendarFeed } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

type Props = {
  houseId: string;
  houseName: string;
  feedHttpsUrl: string;
  canRotateToken: boolean;
  /** Se true: niente card esterna né titolo (usato dentro `<details>`). */
  embedded?: boolean;
};

type PhoneKind = "ios" | "android" | "desktop";

function detectPhoneKind(): PhoneKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

/** Iscrizione Google Calendar (abbonamento lato Google). */
function googleSubscribeUrl(feedHttpsUrl: string): string {
  return `https://www.google.com/calendar/render?cid=${encodeURIComponent(feedHttpsUrl)}`;
}

function usePhoneKind(): PhoneKind {
  const [kind, setKind] = useState<PhoneKind>("desktop");
  useLayoutEffect(() => {
    setKind(detectPhoneKind());
  }, []);
  return kind;
}

const btnPrimary =
  "inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-green-500 active:scale-[0.97] active:shadow-inner active:brightness-95";

function CalendarFeedPanelInner({ houseId, houseName, feedHttpsUrl, canRotateToken, embedded }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const phoneKind = usePhoneKind();
  const [copied, setCopied] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const webcalUrl = feedHttpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  const googleSubscribe = googleSubscribeUrl(feedHttpsUrl);

  const primaryHref = phoneKind === "ios" ? webcalUrl : googleSubscribe;
  const primaryLabel = phoneKind === "ios" ? t("calendarFeed.ctaIos") : t("calendarFeed.ctaGoogle");

  async function copyHttps() {
    setClipboardError(null);
    try {
      await navigator.clipboard.writeText(feedHttpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setClipboardError(t("calendarFeed.copyError"));
    }
  }

  async function onRotate() {
    setRotateError(null);
    if (!confirm(t("calendarFeed.rotateConfirm"))) return;
    setRotating(true);
    const res = await rotateHouseCalendarFeed(houseId);
    setRotating(false);
    if (res.error) {
      setRotateError(res.error);
      return;
    }
    router.refresh();
  }

  const wrapClass = embedded ? "flex flex-col gap-4" : "cv-card-solid flex flex-col gap-4 p-5 sm:p-6";

  return (
    <div className={wrapClass}>
      {!embedded ? (
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t("calendarFeed.title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {t("calendarFeed.subtitle")}{" "}
            <span className="font-medium text-slate-800">{houseName}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-slate-600">
          {t("calendarFeed.subtitle")}{" "}
          <span className="font-medium text-slate-800">{houseName}</span>
        </p>
      )}

      <a
        href={primaryHref}
        target={phoneKind === "ios" ? undefined : "_blank"}
        rel={phoneKind === "ios" ? undefined : "noopener noreferrer"}
        className={btnPrimary}
      >
        <span aria-hidden>📅</span>
        {primaryLabel}
      </a>

      <p className="text-[11px] leading-relaxed text-slate-600">{t("calendarFeed.manualHint")}</p>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">{t("calendarFeed.urlLabel")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            readOnly
            value={feedHttpsUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800"
            aria-label={t("calendarFeed.urlLabel")}
          />
          <button
            type="button"
            onClick={() => void copyHttps()}
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            {copied ? t("calendarFeed.copied") : t("calendarFeed.copy")}
          </button>
        </div>
      </div>

      {clipboardError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{clipboardError}</p>
      ) : null}
      {rotateError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{rotateError}</p>
      ) : null}

      <p className="text-[11px] text-slate-500">{t("calendarFeed.security")}</p>

      {canRotateToken ? (
        <button
          type="button"
          disabled={rotating}
          onClick={() => void onRotate()}
          className="self-start text-xs font-medium text-amber-800 underline decoration-amber-300 hover:text-amber-950 disabled:opacity-50"
        >
          {rotating ? t("calendarFeed.rotating") : t("calendarFeed.rotate")}
        </button>
      ) : null}
    </div>
  );
}

/** Pannello feed a scheda intera (layout precedente). */
export function CalendarFeedPanel(props: Props) {
  return <CalendarFeedPanelInner {...props} embedded={false} />;
}

/**
 * Sezione compatta: chiusa di default; aprendo mostra istruzioni e link per aggiungere il calendario al telefono.
 */
export function CalendarFeedSubscribeSection(props: Props) {
  const { t } = useI18n();
  return (
    <details className="group cv-card-solid overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-sm backdrop-blur-md">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-emerald-50/40 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-bold text-slate-900">{t("calendarFeed.collapsedTitle")}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-600">{t("calendarFeed.collapsedHint")}</p>
        </div>
        <span
          className="shrink-0 rounded-full border border-slate-200/90 bg-white/80 p-1 text-slate-600 transition group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-slate-200/70 px-4 pb-4 pt-1">
        <CalendarFeedPanelInner {...props} embedded />
      </div>
    </details>
  );
}
