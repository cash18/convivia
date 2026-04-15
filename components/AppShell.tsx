"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { CaseListNavLink } from "@/components/CaseListNavLink";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoutButton } from "@/components/LogoutButton";
import { PushNotificationsClient, PushReminderBanner } from "@/components/PushNotificationsClient";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState, startTransition } from "react";

function firstNameFromDisplay(full: string): string {
  const s = full.trim();
  if (!s) return "";
  return s.split(/\s+/)[0] ?? s;
}

function initialsFromDisplay(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0];
    const b = parts[1]![0];
    return (a + b).toUpperCase().slice(0, 2);
  }
  const one = parts[0] ?? "";
  if (one.length >= 2) return one.slice(0, 2).toUpperCase();
  return (one[0] ?? "?").toUpperCase();
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
    startTransition(() => {
      closeMenu();
    });
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const welcomeName = firstNameFromDisplay(userName) || userName.trim() || "…";
  const initials = initialsFromDisplay(userName);

  return (
    <div className="flex min-h-dvh min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-10 w-full min-w-0 border-b border-white/50 bg-white/45 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="cv-shell relative flex items-center justify-between gap-2 py-2 sm:py-2.5">
          <CaseListNavLink className="shrink-0 touch-manipulation py-0.5">
            <BrandLogo />
          </CaseListNavLink>

          <button
            type="button"
            className="inline-flex max-w-[min(100%,16rem)] touch-manipulation items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/85 py-1.5 pl-2.5 pr-2 text-left shadow-sm backdrop-blur transition hover:border-emerald-300/80 hover:bg-emerald-50/50 sm:max-w-[20rem] sm:py-2 sm:pl-3 sm:pr-2.5"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-haspopup="true"
            aria-label={t("nav.accountMenuAria")}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold leading-tight text-slate-600 sm:text-xs">
                {t("nav.welcomeUser").replace("{name}", welcomeName)}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px]">{t("nav.profileMenuHint")}</p>
            </div>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50 text-xs font-bold text-emerald-900 shadow-inner ring-1 ring-white/80"
              aria-hidden
            >
              {initials}
            </span>
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
                className="absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-full z-[19] mt-1.5 max-h-[min(85dvh,32rem)] w-[min(calc(100vw-1.5rem),18.5rem)] overflow-x-visible overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/95 py-1.5 text-sm shadow-xl shadow-emerald-900/10 backdrop-blur-xl sm:right-[max(1.25rem,env(safe-area-inset-right,0px))]"
              >
                <p className="border-b border-slate-100 px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.menuSectionNav")}
                </p>
                <CaseListNavLink
                  role="menuitem"
                  onClick={closeMenu}
                  className="block px-3 py-2.5 font-medium text-slate-800 hover:bg-emerald-50/90"
                >
                  {t("nav.myHouses")}
                </CaseListNavLink>
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
                  <LanguageSwitcher align="left" portalDropdown onAfterSelect={closeMenu} />
                </div>
                <div className="border-t border-slate-100 px-3 py-2">
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
      <PushReminderBanner />
      <div className="cv-shell flex-1 py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
}
