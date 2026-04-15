"use client";

import { LOCALE_COOKIE_NAME, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/I18nProvider";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type LanguageSwitcherProps = {
  align?: "left" | "right";
  onAfterSelect?: () => void;
  /** Dropdown in `position:fixed` sopra il resto (evita tagli nel menu account). */
  portalDropdown?: boolean;
};

export function LanguageSwitcher(props?: LanguageSwitcherProps) {
  const { align = "right", onAfterSelect, portalDropdown = false } = props ?? {};
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [fixedBox, setFixedBox] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !portalDropdown) {
      setFixedBox(null);
      return;
    }
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    const maxListH = Math.min(320, window.innerHeight - r.bottom - pad * 2);
    let left = align === "left" ? r.left : r.right - 11 * 16; // ~11rem
    left = Math.max(pad, Math.min(left, window.innerWidth - 11 * 16 - pad));
    const top = Math.min(r.bottom + 4, window.innerHeight - maxListH - pad);
    setFixedBox({
      top,
      left,
      width: 11 * 16,
      maxH: Math.max(120, maxListH),
    });
  }, [open, portalDropdown, align]);

  useEffect(() => {
    if (!open || !portalDropdown) return;
    function close() {
      setOpen(false);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, portalDropdown]);

  function setLocale(next: AppLocale) {
    // Persist locale on explicit user action (cookie write; not render).
    // eslint-disable-next-line react-hooks/immutability -- browser cookie API
    document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=${60 * 60 * 24 * 400};SameSite=Lax`;
    setOpen(false);
    onAfterSelect?.();
    router.refresh();
  }

  const listClass =
    "max-h-[min(var(--ls-max-h,22rem),70vh)] w-44 overflow-auto rounded-xl border border-slate-200/90 bg-white py-1 text-xs shadow-lg";

  const listInner = (
    <ul
      className={listClass}
      style={
        portalDropdown && fixedBox
          ? ({
              position: "fixed",
              top: fixedBox.top,
              left: fixedBox.left,
              width: fixedBox.width,
              maxHeight: fixedBox.maxH,
              zIndex: 10060,
              ["--ls-max-h" as string]: `${fixedBox.maxH}px`,
            } as CSSProperties)
          : undefined
      }
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
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-manipulation rounded-xl border border-slate-200/90 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-900"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("common.language")}
      >
        {LOCALE_LABELS[locale]?.slice(0, 3) ?? locale}
      </button>
      {open && !portalDropdown ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <ul
            className={`absolute z-50 mt-1 max-h-[min(70vh,22rem)] w-44 overflow-auto rounded-xl border border-slate-200/90 bg-white py-1 text-xs shadow-lg ${
              align === "left" ? "left-0" : "right-0"
            }`}
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
      {open && portalDropdown && fixedBox
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[10050] cursor-default bg-transparent"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
              {listInner}
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
