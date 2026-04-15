"use client";

import {
  IconCalendar,
  IconCart,
  IconCheck,
  IconHome,
  IconUsers,
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
  { href: (id: string) => `/casa/${id}/membri`, labelKey: "casaNav.members" as const, Icon: IconUsers },
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

  return (
    <div className="cv-card-solid mb-4 px-3 py-3 sm:mb-5 sm:px-4 sm:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="sr-only">
            {t("casaNav.activeHouse")}:{" "}
          </span>
          <h1 className="max-w-full text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{houseName}</h1>
          <span className="hidden text-slate-300 sm:inline" aria-hidden>
            ·
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-600 sm:text-sm">
            <span className="shrink-0">{t("casaNav.inviteCode")}</span>
            <code className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-emerald-900 sm:text-xs">
              {inviteCode}
            </code>
          </span>
        </div>
        <Link
          href="/case"
          className="cv-pill-nav shrink-0 touch-manipulation px-3 py-1.5 text-xs font-semibold sm:text-sm"
        >
          {t("casaNav.switchHome")}
        </Link>
      </div>

      <nav
        className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-3"
        aria-label={t("casaNav.sectionsAria")}
      >
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
                  ? "inline-flex touch-manipulation items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-green-500/25 transition active:scale-[0.97] active:shadow-inner active:brightness-95 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
                  : "cv-pill-nav inline-flex touch-manipulation items-center gap-1.5 px-2.5 py-1.5 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
              }
            >
              <Icon className={`h-[0.95rem] w-[0.95rem] shrink-0 sm:h-[1.05rem] sm:w-[1.05rem] ${active ? "text-white" : "text-emerald-700"}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
