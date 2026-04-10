import {
  IconCalendar,
  IconCart,
  IconCheck,
  IconWallet,
} from "@/components/CasaSectionIcons";
import Link from "next/link";

const sections = [
  {
    href: (id: string) => `/casa/${id}/spese`,
    title: "Spese",
    description: "Saldi, storico e nuove uscite condivise",
    accent: "from-emerald-500/20 to-teal-500/10",
    Icon: IconWallet,
  },
  {
    href: (id: string) => `/casa/${id}/calendario`,
    title: "Calendario",
    description: "Eventi, turni e appuntamenti della casa",
    accent: "from-cyan-500/20 to-sky-500/10",
    Icon: IconCalendar,
  },
  {
    href: (id: string) => `/casa/${id}/liste`,
    title: "Liste spesa",
    description: "Liste collaborative da spuntare",
    accent: "from-lime-500/18 to-emerald-500/10",
    Icon: IconCart,
  },
  {
    href: (id: string) => `/casa/${id}/compiti`,
    title: "Compiti",
    description: "Cose da fare e chi le gestisce",
    accent: "from-amber-500/20 to-orange-500/10",
    Icon: IconCheck,
  },
] as const;

export function CasaHomeQuickNav({ houseId }: { houseId: string }) {
  return (
    <nav aria-label="Sezioni della casa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((s) => {
        const Si = s.Icon;
        return (
        <Link
          key={s.title}
          href={s.href(houseId)}
          className="cv-card-solid group flex touch-manipulation flex-col gap-1 p-4 transition hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.2)] active:scale-[0.98] active:brightness-[0.98]"
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-emerald-800 ring-1 ring-emerald-200/50`}
              aria-hidden
            >
              <Si className="h-5 w-5" />
            </div>
            <div
              className={`h-1 min-w-[2.5rem] flex-1 rounded-full bg-gradient-to-r ${s.accent} ring-1 ring-white/60`}
              aria-hidden
            />
          </div>
          <span className="font-bold text-slate-900 group-hover:text-emerald-900">{s.title}</span>
          <span className="text-xs leading-snug text-slate-600">{s.description}</span>
          <span className="mt-2 text-xs font-semibold text-emerald-700">Apri →</span>
        </Link>
        );
      })}
    </nav>
  );
}
