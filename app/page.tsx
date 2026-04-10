import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold tracking-tight text-emerald-950">Convivia</span>
          <div className="flex gap-2">
            <Link
              href="/accedi"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Accedi
            </Link>
            <Link
              href="/registrati"
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Registrati
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-16">
        <section className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">Per la tua casa condivisa</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Organizza convivenza, spese e turni in un unico portale.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600">
            Ispirato a strumenti come Flatify e OurHome: più coinquilini, un&apos;unica casa digitale. Gestisci
            le spese condivise con ripartizione, un calendario per eventi e prenotazioni, liste della spesa
            collaborative e compiti assegnabili a chi preferisci.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/registrati"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            >
              Inizia gratis
            </Link>
            <Link
              href="/accedi"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Ho già un account
            </Link>
          </div>
        </section>
        <section className="grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Spese e saldi",
              text: "Registra chi ha pagato e dividi il costo tra i coinquilini. Vedi in un colpo d’occhio chi deve cosa.",
            },
            {
              title: "Calendario casa",
              text: "Turni, visite, pulizie o eventi: tutto visibile al gruppo con date e note.",
            },
            {
              title: "Liste spesa",
              text: "Liste condivise con voci da spuntare: niente più dimenticanze al supermercato.",
            },
            {
              title: "Compiti",
              text: "Assegna chi fa cosa, con scadenze opzionali e stato completato.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        Convivia — prototipo locale con SQLite. Per produzione usa Postgres e variabili d&apos;ambiente
        sicure.
      </footer>
    </div>
  );
}
