"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoutButton } from "@/components/LogoutButton";
import { PushNotificationsClient } from "@/components/PushNotificationsClient";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/45 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 py-2.5 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:gap-3 sm:py-3 sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Link href="/case" className="shrink-0">
              <BrandLogo />
            </Link>
            <nav className="flex min-w-0 flex-wrap gap-1">
              <Link href="/case" className="cv-pill-nav text-xs sm:text-sm">
                {t("nav.myHouses")}
              </Link>
              <Link href="/impostazioni" className="cv-pill-nav text-xs sm:text-sm">
                {t("nav.settings")}
              </Link>
            </nav>
          </div>
          <div className="flex w-full max-w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:gap-3">
            <PushNotificationsClient />
            <LanguageSwitcher />
            <span className="max-w-[9rem] truncate text-xs font-medium text-slate-600 sm:max-w-[12rem] sm:text-sm">{userName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 py-5 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:py-7 sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
        {children}
      </div>
    </div>
  );
}
