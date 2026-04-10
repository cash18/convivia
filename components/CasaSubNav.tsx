"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: (id: string) => `/casa/${id}`, label: "Home" },
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
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/60 bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-500/25 transition hover:from-emerald-500 hover:to-green-500"
            >
              <svg className="h-4 w-4 shrink-0 opacity-95" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
              </svg>
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
          return (
            <Link
              key={l.label}
              href={href}
              className={
                active
                  ? "rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-green-500/25"
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
