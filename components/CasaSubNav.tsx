"use client";

import {
  IconCalendar,
  IconCart,
  IconCheck,
  IconHome,
  IconWallet,
} from "@/components/CasaSectionIcons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: (id: string) => `/casa/${id}`, label: "Home", Icon: IconHome },
  { href: (id: string) => `/casa/${id}/spese`, label: "Spese", Icon: IconWallet },
  { href: (id: string) => `/casa/${id}/calendario`, label: "Calendario", Icon: IconCalendar },
  { href: (id: string) => `/casa/${id}/liste`, label: "Liste spesa", Icon: IconCart },
  { href: (id: string) => `/casa/${id}/compiti`, label: "Compiti", Icon: IconCheck },
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
  const pathname = usePathname();
  const homeHref = `/casa/${houseId}`;
  const isHouseHome = pathname === homeHref;

  return (
    <div className="cv-card-solid mb-8 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">Casa attiva</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{houseName}</h1>
          <p className="text-sm text-slate-600">
            Codice invito:{" "}
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
              Home della casa
            </Link>
          ) : null}
          <Link href="/case" className="cv-link text-sm">
            ← Altre case
          </Link>
        </div>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-200/60 pt-5" aria-label="Sottomenu sezioni">
        {links.map((l) => {
          const href = l.href(houseId);
          const active = pathname === href;
          const Icon = l.Icon;
          return (
            <Link
              key={l.label}
              href={href}
              className={
                active
                  ? "inline-flex touch-manipulation items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-green-500/25 transition active:scale-[0.97] active:shadow-inner active:brightness-95"
                  : "cv-pill-nav inline-flex touch-manipulation items-center gap-2"
              }
            >
              <Icon className={`h-[1.1rem] w-[1.1rem] shrink-0 ${active ? "text-white" : "text-emerald-700"}`} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
