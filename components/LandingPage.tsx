import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

function IconRing({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${className ?? ""}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

const features = [
  {
    title: "Spese e saldi trasparenti",
    description:
      "Registra chi ha pagato, riparti in parti uguali o in percentuali (con suggerimento del resto fino al 100%). Vedi subito chi deve a chi.",
    icon: "€",
    tone: "bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-500/20",
  },
  {
    title: "Scontrino e importo intelligente",
    description:
      "Allega una foto dello scontrino: l’app può suggerire il totale dal testo riconosciuto. Controlla sempre l’importo prima di salvare.",
    icon: "📷",
    tone: "bg-teal-500/12 text-teal-900 ring-1 ring-teal-500/20",
  },
  {
    title: "Calendario casa e vista chiara",
    description:
      "Eventi condivisi con vista mese e settimana. Tutto il giorno o con orari: la casa resta allineata su turni, bollette e appuntamenti.",
    icon: "◷",
    tone: "bg-cyan-500/12 text-cyan-900 ring-1 ring-cyan-500/20",
  },
  {
    title: "Sul tuo Google o Apple Calendar",
    description:
      "Ogni casa ha un calendario dedicato in abbonamento (link privato): gli eventi del gruppo compaiono accanto al tuo calendario personale sul telefono.",
    icon: "↗",
    tone: "bg-green-500/12 text-green-900 ring-1 ring-green-500/20",
  },
  {
    title: "Liste spesa collaborative",
    description:
      "Liste per stanza o per spesa: aggiungi voci, spunta in tempo reale e evita dimenticanze quando qualcuno passa dal supermercato.",
    icon: "☰",
    tone: "bg-lime-500/12 text-lime-900 ring-1 ring-lime-500/25",
  },
  {
    title: "Compiti e responsabilità",
    description:
      "Assegna chi fa cosa (pulizie, amministrazione, turni): stato visibile per tutti così niente resta in sospeso.",
    icon: "✓",
    tone: "bg-amber-500/12 text-amber-900 ring-1 ring-amber-500/25",
  },
] as const;

const steps = [
  {
    n: "1",
    title: "Crea account e una casa",
    text: "Registrati in pochi secondi, dai un nome alla convivenza e ottieni il codice invito per i coinquilini.",
  },
  {
    n: "2",
    title: "Invita il gruppo",
    text: "Condividi il codice: ogni membro accede alle stesse spese, calendario, liste e compiti della casa.",
  },
  {
    n: "3",
    title: "Usa da browser o come app",
    text: "Apri Convivia dal telefono e aggiungila alla schermata Home: resta a portata di tap, anche offline per consultare.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lime-400/15 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/40 bg-white/40 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="min-w-0">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex" aria-label="Sezioni">
            <a href="#funzionalita" className="transition hover:text-emerald-800">
              Funzionalità
            </a>
            <a href="#come-funziona" className="transition hover:text-emerald-800">
              Come funziona
            </a>
            <a href="#perche" className="transition hover:text-emerald-800">
              Perché Convivia
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/accedi" className="cv-btn-ghost px-3 py-2 text-sm sm:px-4">
              Accedi
            </Link>
            <Link href="/registrati" className="cv-btn-primary px-3 py-2 text-sm sm:px-4">
              Registrati
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {/* Hero */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="cv-badge">Casa condivisa · meno attriti · più chiarezza</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem]">
              La tua convivenza,{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                organizzata come un team
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Convivia è lo spazio digitale della casa: spese, calendario, liste e compiti in un unico posto — pensato
              per coinquilini e famiglie che vogliono decidere in fretta e dimenticarsi dei conti in sospeso.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Nessun foglio Excel da aggiornare a mano
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Stessi dati per tutti, aggiornati in tempo reale
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Sul telefono come app (Android e iPhone)
              </li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/registrati" className="cv-btn-primary px-7 py-3.5 text-base">
                Crea la tua casa gratis
              </Link>
              <Link
                href="/accedi"
                className="cv-btn-outline max-w-md px-5 py-3 text-center text-sm leading-snug sm:px-7 sm:py-3.5 sm:text-base"
              >
                Accedi al tuo account: crea o gestisci le tue case
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Nessun costo nascosto per iniziare: crea case, invita membri e usa le funzioni principali da subito.
            </p>
          </div>

          <div className="relative lg:pl-4">
            <div className="cv-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-emerald-400/35 to-teal-400/25 blur-2xl" />
              <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">Cosa trovi dentro</p>
              <p className="mt-2 text-xl font-bold text-slate-900">Una dashboard per tutta la casa</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-emerald-500/15 text-emerald-800">€</IconRing>
                  <span>
                    <strong className="text-slate-800">Spese</strong> con ripartizione e storico chiaro
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-teal-500/15 text-teal-800">◷</IconRing>
                  <span>
                    <strong className="text-slate-800">Calendario</strong> condiviso + sync sul telefono
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-lime-500/15 text-lime-900">✓</IconRing>
                  <span>
                    <strong className="text-slate-800">Liste e compiti</strong> sempre sotto controllo
                  </span>
                </li>
              </ul>
              <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 text-xs leading-relaxed text-emerald-950">
                <strong className="font-semibold">Suggerimento:</strong> dopo il login, crea una casa e condividi il
                codice invito in chat di gruppo — in pochi minuti siete operativi.
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mt-20 grid gap-4 sm:grid-cols-3" aria-label="Punti di forza">
          {[
            { t: "Dati su Postgres", d: "Ambiente professionale, backup e buone pratiche di sicurezza." },
            { t: "Progettato per il mobile", d: "Interfaccia comoda da polso e installabile come app sullo schermo Home." },
            { t: "Solo chi abita con te", d: "Ogni casa è uno spazio separato: vedi solo le convivenze di cui fai parte." },
          ].map((x) => (
            <div key={x.t} className="cv-card-solid rounded-2xl p-5 text-center sm:text-left">
              <p className="text-sm font-bold text-slate-900">{x.t}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{x.d}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section id="funzionalita" className="mt-24 scroll-mt-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Tutte le funzionalità</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Tutto ciò che serve per convivere senza perdere il filo: meno messaggi in croce, più decisioni chiare.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="cv-card-solid group flex flex-col rounded-2xl p-6 transition hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.18)]"
              >
                <IconRing className={f.tone}>{f.icon}</IconRing>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="come-funziona" className="mt-24 scroll-mt-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Come funziona</h2>
            <p className="mt-3 text-base text-slate-600">Tre passi per passare dal caos alla routine.</p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="relative cv-card-solid rounded-2xl p-6 pt-8">
                <span
                  className="absolute -top-3 left-6 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25"
                  aria-hidden
                >
                  {s.n}
                </span>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Why */}
        <section id="perche" className="mt-24 scroll-mt-24">
          <div className="cv-card relative overflow-hidden rounded-[1.75rem] p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Perché usare Convivia ogni giorno
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Le liti da coinquilini nascono spesso da informazioni sparse: chi ha pagato la spesa, chi ricorda la
                bolletta, chi va in lavanderia. Convivia mette tutto in un unico calendario e un unico registro
                economico — così ognuno sa cosa fare e quanto deve, senza dover chiedere ogni volta.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  Meno stress: percentuali e saldi calcolati per te.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  Più equità: tutti vedono le stesse cifre e le stesse date.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  Più velocità: apri l’app dalla Home e registri in pochi tap.
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/registrati" className="cv-btn-primary px-6 py-3 text-base">
                  Inizia ora — è gratis
                </Link>
                <a href="#funzionalita" className="cv-btn-outline px-6 py-3 text-base">
                  Rivedi le funzioni
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ light */}
        <section className="mt-24" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Domande frequenti
          </h2>
          <dl className="mt-8 space-y-6">
            <div className="border-b border-slate-200/80 pb-6">
              <dt className="font-semibold text-slate-900">Serve installare un’app?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                Puoi usare Convivia dal browser. Su smartphone puoi anche aggiungerla alla schermata Home: si apre a
                tutto schermo come un’app nativa (consigliato per usarla ogni giorno).
              </dd>
            </div>
            <div className="border-b border-slate-200/80 pb-6">
              <dt className="font-semibold text-slate-900">I miei eventi personali finiscono nella casa?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                No. Il calendario della casa è separato: puoi iscriverlo al tuo Google o Apple Calendar come calendario
                aggiuntivo, così vedi insieme impegni personali e impegni del gruppo.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Quante case posso avere?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                Puoi creare o entrare in più case (es. casa universitaria e famiglia): dalla pagina &quot;Le mie case&quot;
                passi dall’una all’altra in un tap.
              </dd>
            </div>
          </dl>
        </section>

        {/* Final CTA */}
        <section className="mt-24 rounded-[1.75rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-12 text-center sm:px-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Pronto a semplificare la convivenza?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            Crea un account, apri la tua prima casa e invita chi vive con te. In pochi minuti smetti di inseguire
            messaggi e inizi a usare un solo posto per organizzarvi.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/registrati" className="cv-btn-primary px-8 py-3.5 text-base">
              Registrati gratis
            </Link>
            <Link
              href="/accedi"
              className="max-w-lg touch-manipulation rounded-2xl border-2 border-slate-300/80 bg-white/80 px-5 py-3 text-center text-sm font-semibold leading-snug text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-white active:scale-[0.97] active:border-emerald-500/50 active:bg-emerald-50/90 active:shadow-inner sm:px-8 sm:py-3.5 sm:text-base"
            >
              Accedi al tuo account: crea o gestisci le tue case
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/40 bg-white/30 py-10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <BrandLogo />
          <p className="max-w-md text-xs leading-relaxed text-slate-500">
            Convivia — organizzazione condivisa per la casa. Dati ospitati in modo sicuro; consigliato l’uso da HTTPS
            in produzione.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <Link href="/accedi" className="cv-link">
              Accedi
            </Link>
            <Link href="/registrati" className="cv-link">
              Registrati
            </Link>
            <a href="#funzionalita" className="cv-link">
              Funzionalità
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
