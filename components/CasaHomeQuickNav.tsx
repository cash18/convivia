import Link from "next/link";

const sections = [
  {
    href: (id: string) => `/casa/${id}/spese`,
    title: "Spese",
    description: "Saldi, storico e nuove uscite condivise",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    href: (id: string) => `/casa/${id}/calendario`,
    title: "Calendario",
    description: "Eventi, turni e appuntamenti della casa",
    accent: "from-cyan-500/20 to-sky-500/10",
  },
  {
    href: (id: string) => `/casa/${id}/liste`,
    title: "Liste spesa",
    description: "Liste collaborative da spuntare",
    accent: "from-fuchsia-500/15 to-pink-500/10",
  },
  {
    href: (id: string) => `/casa/${id}/compiti`,
    title: "Compiti",
    description: "Cose da fare e chi le gestisce",
    accent: "from-amber-500/20 to-orange-500/10",
  },
] as const;

export function CasaHomeQuickNav({ houseId }: { houseId: string }) {
  return (
    <nav aria-label="Sezioni della casa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((s) => (
        <Link
          key={s.title}
          href={s.href(houseId)}
          className="cv-card-solid group flex flex-col gap-1 p-4 transition hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.2)]"
        >
          <div
            className={`mb-1 h-1 w-10 rounded-full bg-gradient-to-r ${s.accent} ring-1 ring-white/60`}
            aria-hidden
          />
          <span className="font-bold text-slate-900 group-hover:text-indigo-900">{s.title}</span>
          <span className="text-xs leading-snug text-slate-600">{s.description}</span>
          <span className="mt-2 text-xs font-semibold text-violet-700">Apri →</span>
        </Link>
      ))}
    </nav>
  );
}
