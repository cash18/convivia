"use client";

import { useI18n } from "@/components/I18nProvider";
import { useCallback, useMemo, useState } from "react";

function toAbsoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${href.startsWith("/") ? href : `/${href}`}`;
  }
  return href;
}

export function InviteLinkShareRow({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const absolute = useMemo(() => toAbsoluteUrl(href), [href]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [absolute]);

  const onShare = useCallback(async () => {
    if (!navigator.share) {
      await onCopy();
      return;
    }
    try {
      await navigator.share({
        url: absolute,
        title: t("inviteShare.shareTitle"),
        text: t("inviteShare.shareText"),
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await onCopy();
    }
  }, [absolute, onCopy, t]);

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className={`rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 sm:p-4 ${className}`}>
      <p className="break-all font-mono text-[11px] leading-snug text-slate-700 sm:text-xs">{absolute}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void onCopy()} className="cv-btn-outline px-3 py-2 text-xs font-semibold">
          {copied ? t("inviteShare.copied") : t("inviteShare.copy")}
        </button>
        {canNativeShare ? (
          <button type="button" onClick={() => void onShare()} className="cv-btn-primary px-3 py-2 text-xs font-semibold">
            {t("inviteShare.share")}
          </button>
        ) : null}
      </div>
      {!canNativeShare ? <p className="mt-2 text-[11px] text-slate-500">{t("inviteShare.shareUnavailable")}</p> : null}
    </div>
  );
}
