"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: (id: string) => `/casa/${id}`, label: "Panoramica" },
  { href: (id: string) => `/casa/${id}/spese`, label: "Spese" },
  { href: (id: string) => `/casa/${id}/calendario`, label: "Calendario" },
  { href: (id: string) => `/casa/${id}/liste`, label: "Liste spesa" },
  { href: (id: string) => `/casa/${id}/compiti`, label: "Compiti" },
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

  return (
    <div className="cv-card-solid mb-8 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-violet-600 uppercase">Casa attiva</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{houseName}</h1>
          <p className="text-sm text-slate-600">
            Codice invito:{" "}
            <code className="rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-1 font-mono text-sm font-semibold text-indigo-900">
              {inviteCode}
            </code>
          </p>
        </div>
        <Link href="/case" className="cv-link text-sm shrink-0">
          ← Altre case
        </Link>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-200/60 pt-5">
        {links.map((l) => {
          const href = l.href(houseId);
          const active = pathname === href;
          return (
            <Link
              key={l.label}
              href={href}
              className={
                active
                  ? "rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25"
                  : "cv-pill-nav"
              }
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
