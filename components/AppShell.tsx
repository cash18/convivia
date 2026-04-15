"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoutButton } from "@/components/LogoutButton";
import { PushNotificationsClient } from "@/components/PushNotificationsClient";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-600 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  return (
    <div className="flex min-h-dvh min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/45 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 py-2 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:py-2.5 sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <Link href="/case" className="shrink-0 touch-manipulation py-0.5">
            <BrandLogo className="scale-[0.92] sm:scale-100" />
          </Link>

          <button
            type="button"
            className="inline-flex max-w-[min(100%,14rem)] touch-manipulation items-center gap-2 rounded-xl border border-slate-200/90 bg-white/85 px-2.5 py-1.5 text-left shadow-sm backdrop-blur transition hover:border-emerald-300/80 hover:bg-emerald-50/50 sm:max-w-[18rem] sm:px-3 sm:py-2"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-haspopup="true"
            aria-label={t("nav.accountMenuAria")}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 sm:text-sm">{userName}</span>
            <ChevronIcon open={menuOpen} />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[18] cursor-default bg-slate-900/20"
                aria-hidden
                tabIndex={-1}
                onClick={closeMenu}
              />
              <div
                id={menuId}
                role="menu"
                className="absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-full z-[19] mt-1.5 w-[min(calc(100vw-1.5rem),18.5rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 py-1.5 text-sm shadow-xl shadow-emerald-900/10 backdrop-blur-xl sm:right-[max(1.25rem,env(safe-area-inset-right,0px))]"
              >
                <p className="border-b border-slate-100 px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.menuSectionNav")}
                </p>
                <Link
                  href="/case"
                  role="menuitem"
                  onClick={closeMenu}
                  className="block px-3 py-2.5 font-medium text-slate-800 hover:bg-emerald-50/90"
                >
                  {t("nav.myHouses")}
                </Link>
                <Link
                  href="/impostazioni"
                  role="menuitem"
                  onClick={closeMenu}
                  className="block px-3 py-2.5 font-medium text-slate-800 hover:bg-emerald-50/90"
                >
                  {t("nav.settings")}
                </Link>

                <p className="mt-1 border-t border-slate-100 px-3 pb-1.5 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.menuSectionPrefs")}
                </p>
                <div className="px-3 pb-2">
                  <p className="mb-1 text-xs text-slate-600">{t("common.language")}</p>
                  <LanguageSwitcher align="left" onAfterSelect={closeMenu} />
                </div>
                <div className="border-t border-slate-100 px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-slate-600">{t("nav.menuPush")}</p>
                  <PushNotificationsClient compact />
                </div>
                <div className="border-t border-slate-100 px-2 pb-1 pt-1">
                  <LogoutButton className="cv-btn-ghost inline-flex w-full justify-center py-2 text-sm" />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 py-4 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:py-6 sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
        {children}
      </div>
    </div>
  );
}
