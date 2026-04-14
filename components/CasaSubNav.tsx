"use client";

import {
  IconCalendar,
  IconCart,
  IconCheck,
  IconHome,
  IconWallet,
} from "@/components/CasaSectionIcons";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

const linkKeys = [
  { href: (id: string) => `/casa/${id}`, labelKey: "casaNav.home" as const, Icon: IconHome },
  { href: (id: string) => `/casa/${id}/spese`, labelKey: "casaNav.expenses" as const, Icon: IconWallet },
  { href: (id: string) => `/casa/${id}/calendario`, labelKey: "casaNav.calendar" as const, Icon: IconCalendar },
  { href: (id: string) => `/casa/${id}/liste`, labelKey: "casaNav.lists" as const, Icon: IconCart },
  { href: (id: string) => `/casa/${id}/compiti`, labelKey: "casaNav.tasks" as const, Icon: IconCheck },
] as const;

export function CasaSubNav({
  houseId,
  houseName,
  inviteCode,
}: {
  houseId: string;
  houseName: string;
  inviteCode: string;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const homeHref = `/casa/${houseId}`;
  const isHouseHome = pathname === homeHref;

  return (
    <div className="cv-card-solid mb-6 p-4 sm:mb-8 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">{t("casaNav.activeHouse")}</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{houseName}</h1>
          <p className="text-sm text-slate-600">
            {t("casaNav.inviteCode")}{" "}
            <code className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-green-50 px-2.5 py-1 font-mono text-sm font-semibold text-green-900">
              {inviteCode}
            </code>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {!isHouseHome ? (
            <Link
              href={homeHref}
              className="inline-flex touch-manipulation items-center gap-2 rounded-xl border border-emerald-300/60 bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-500/25 transition hover:from-emerald-500 hover:to-green-500 active:scale-[0.97] active:shadow-inner active:brightness-95"
            >
              <IconHome className="h-4 w-4 shrink-0 opacity-95" />
              {t("casaNav.homeButton")}
            </Link>
          ) : null}
          <Link href="/case" className="cv-link text-sm">
            {t("casaNav.otherHouses")}
          </Link>
        </div>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4 sm:mt-5 sm:pt-5" aria-label="Sottomenu sezioni">
        {linkKeys.map((l) => {
          const href = l.href(houseId);
          const active = pathname === href;
          const Icon = l.Icon;
          const label = t(l.labelKey);
          return (
            <Link
              key={l.labelKey}
              href={href}
              className={
                active
                  ? "inline-flex touch-manipulation items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-green-500/25 transition active:scale-[0.97] active:shadow-inner active:brightness-95 sm:px-3.5 sm:py-2 sm:text-sm"
                  : "cv-pill-nav inline-flex touch-manipulation items-center gap-2 px-3 py-1.5 text-xs sm:py-2 sm:text-sm"
              }
            >
              <Icon className={`h-[1rem] w-[1rem] shrink-0 sm:h-[1.1rem] sm:w-[1.1rem] ${active ? "text-white" : "text-emerald-700"}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
