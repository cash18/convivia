"use client";

import { LOCALE_COOKIE_NAME, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/I18nProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function setLocale(next: AppLocale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=${60 * 60 * 24 * 400};SameSite=Lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-manipulation rounded-xl border border-slate-200/90 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-900"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("common.language")}
      >
        {LOCALE_LABELS[locale]?.slice(0, 3) ?? locale}
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <ul
            className="absolute right-0 z-50 mt-1 max-h-[min(70vh,22rem)] w-44 overflow-auto rounded-xl border border-slate-200/90 bg-white py-1 text-xs shadow-lg"
            role="listbox"
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <li key={loc} role="option" aria-selected={loc === locale}>
                <button
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`flex w-full px-3 py-2 text-left hover:bg-emerald-50 ${loc === locale ? "font-bold text-emerald-900" : "text-slate-800"}`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
