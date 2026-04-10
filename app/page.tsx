import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/40 bg-white/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/accedi" className="cv-btn-ghost px-4 py-2">
              Accedi
            </Link>
            <Link href="/registrati" className="cv-btn-primary px-4 py-2 text-sm">
              Registrati
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-14 sm:px-6 lg:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="cv-badge">Sync casa · spese · calendario</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Tutto ciò che la tua{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                casa condivisa
              </span>{" "}
              fa, in un solo posto.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Convivia tiene allineati coinquilini, budget e turni — come le migliori app di produttività: chiaro,
              veloce, sempre sincronizzato.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/registrati" className="cv-btn-primary px-6 py-3.5 text-base">
                Inizia gratis
              </Link>
              <Link href="/accedi" className="cv-btn-outline px-6 py-3.5 text-base">
                Ho già un account
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="cv-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/30 blur-2xl" />
              <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">Anteprima</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Dashboard casa</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                    €
                  </span>
                  <span>Spese ripartite e saldi in tempo reale</span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-700">
                    ◷
                  </span>
                  <span>Calendario e turni condivisi</span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700">
                    ✓
                  </span>
                  <span>Liste spesa e compiti assegnati</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Spese e saldi",
              text: "Chi ha pagato, come si divide, chi deve cosa — sempre aggiornato.",
              tone: "from-indigo-500/20 to-violet-500/10",
            },
            {
              title: "Calendario",
              text: "Turni, pulizie, eventi: una timeline chiara per tutti.",
              tone: "from-cyan-500/20 to-sky-500/10",
            },
            {
              title: "Liste spesa",
              text: "Liste collaborative con spunta veloce al supermercato.",
              tone: "from-fuchsia-500/15 to-pink-500/10",
            },
            {
              title: "Compiti",
              text: "Assegna responsabilità e segui lo stato fino al completamento.",
              tone: "from-amber-500/20 to-orange-500/10",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`cv-card-solid group p-6 transition hover:shadow-[0_12px_48px_-12px_rgba(99,102,241,0.25)]`}
            >
              <div
                className={`mb-4 h-1 w-12 rounded-full bg-gradient-to-r ${f.tone} ring-1 ring-white/60`}
                aria-hidden
              />
              <h2 className="text-base font-bold text-slate-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/40 bg-white/25 py-6 text-center text-xs text-slate-500 backdrop-blur-md">
        Convivia — ospitato in modo sicuro con Postgres e variabili d&apos;ambiente protette.
      </footer>
    </div>
  );
}
