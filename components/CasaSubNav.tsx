import Link from "next/link";

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
  return (
    <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{houseName}</h1>
          <p className="text-sm text-zinc-600">
            Codice invito:{" "}
            <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-emerald-900">{inviteCode}</code>
          </p>
        </div>
        <Link
          href="/case"
          className="text-sm font-medium text-emerald-800 underline decoration-emerald-800/30 hover:decoration-emerald-800"
        >
          ← Altre case
        </Link>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href(houseId)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
