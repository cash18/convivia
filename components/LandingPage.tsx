import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LandingFeaturesIllustration } from "@/components/LandingFeaturesIllustration";
import { createTranslator } from "@/lib/i18n/server";

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

export async function LandingPage() {
  const { t } = await createTranslator();

  const features = [
    {
      title: t("landing.feature0Title"),
      description: t("landing.feature0Desc"),
      icon: "€",
      tone: "bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-500/20",
    },
    {
      title: t("landing.feature1Title"),
      description: t("landing.feature1Desc"),
      icon: "📷",
      tone: "bg-teal-500/12 text-teal-900 ring-1 ring-teal-500/20",
    },
    {
      title: t("landing.feature2Title"),
      description: t("landing.feature2Desc"),
      icon: "◷",
      tone: "bg-cyan-500/12 text-cyan-900 ring-1 ring-cyan-500/20",
    },
    {
      title: t("landing.feature3Title"),
      description: t("landing.feature3Desc"),
      icon: "↗",
      tone: "bg-green-500/12 text-green-900 ring-1 ring-green-500/20",
    },
    {
      title: t("landing.feature4Title"),
      description: t("landing.feature4Desc"),
      icon: "☰",
      tone: "bg-lime-500/12 text-lime-900 ring-1 ring-lime-500/25",
    },
    {
      title: t("landing.feature5Title"),
      description: t("landing.feature5Desc"),
      icon: "✓",
      tone: "bg-amber-500/12 text-amber-900 ring-1 ring-amber-500/25",
    },
  ] as const;

  const steps = [
    { n: "1", title: t("landing.step1Title"), text: t("landing.step1Text") },
    { n: "2", title: t("landing.step2Title"), text: t("landing.step2Text") },
    { n: "3", title: t("landing.step3Title"), text: t("landing.step3Text") },
  ] as const;

  const trust = [
    { title: t("landing.trust1Title"), d: t("landing.trust1Desc") },
    { title: t("landing.trust2Title"), d: t("landing.trust2Desc") },
    { title: t("landing.trust3Title"), d: t("landing.trust3Desc") },
  ];

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
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex" aria-label={t("landing.navAria")}>
            <a href="#funzionalita" className="transition hover:text-emerald-800">
              {t("landing.navFeatures")}
            </a>
            <a href="#come-funziona" className="transition hover:text-emerald-800">
              {t("landing.navHow")}
            </a>
            <a href="#perche" className="transition hover:text-emerald-800">
              {t("landing.navWhy")}
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/accedi" className="cv-btn-ghost px-3 py-2 text-sm sm:px-4">
              {t("landing.navLogin")}
            </Link>
            <Link href="/registrati" className="cv-btn-primary px-3 py-2 text-sm sm:px-4">
              {t("landing.navRegister")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="cv-badge">{t("landing.heroBadge")}</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem]">
              {t("landing.heroTitleBefore")}{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                {t("landing.heroTitleHighlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{t("landing.heroLead")}</p>
            <ul className="mt-8 flex flex-col gap-3 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> {t("landing.heroLi1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> {t("landing.heroLi2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> {t("landing.heroLi3")}
              </li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/registrati" className="cv-btn-primary px-7 py-3.5 text-base">
                {t("landing.heroCtaPrimary")}
              </Link>
              <Link
                href="/accedi"
                className="cv-btn-outline max-w-md px-5 py-3 text-center text-sm leading-snug sm:px-7 sm:py-3.5 sm:text-base"
              >
                {t("landing.heroCtaSecondary")}
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">{t("landing.heroFootnote")}</p>
          </div>

          <div className="relative lg:pl-4">
            <div className="flex flex-col gap-5">
              <figure className="relative aspect-[1376/768] w-full overflow-hidden rounded-2xl border border-emerald-200/50 bg-slate-100/60 shadow-[0_20px_50px_-20px_rgba(5,150,105,0.35)] ring-1 ring-white/90">
                <Image
                  src="/landing/landing-hero-shared-home.png"
                  alt={t("landing.heroImageAlt")}
                  width={1376}
                  height={768}
                  className="h-full w-full object-cover object-center"
                  priority
                  sizes="(max-width: 1024px) 100vw, 520px"
                />
              </figure>
              <div className="cv-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-emerald-400/35 to-teal-400/25 blur-2xl" />
              <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">{t("landing.cardEyebrow")}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{t("landing.cardTitle")}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-emerald-500/15 text-emerald-800">€</IconRing>
                  <span>
                    <strong className="text-slate-800">{t("landing.cardLi1Strong")}</strong> {t("landing.cardLi1Rest")}
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-teal-500/15 text-teal-800">◷</IconRing>
                  <span>
                    <strong className="text-slate-800">{t("landing.cardLi2Strong")}</strong> {t("landing.cardLi2Rest")}
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3.5">
                  <IconRing className="bg-lime-500/15 text-lime-900">✓</IconRing>
                  <span>
                    <strong className="text-slate-800">{t("landing.cardLi3Strong")}</strong> {t("landing.cardLi3Rest")}
                  </span>
                </li>
              </ul>
              <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 text-xs leading-relaxed text-emerald-950">
                <strong className="font-semibold">{t("landing.cardHintStrong")}</strong> {t("landing.cardHintRest")}
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3" aria-label={t("landing.navFeatures")}>
          {trust.map((x) => (
            <div key={x.title} className="cv-card-solid rounded-2xl p-5 text-center sm:text-left">
              <p className="text-sm font-bold text-slate-900">{x.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{x.d}</p>
            </div>
          ))}
        </section>

        <figure
          className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-emerald-200/40 bg-white/60 shadow-md shadow-emerald-900/5 ring-1 ring-white/80"
          role="img"
          aria-label={t("landing.featuresStripImageAlt")}
        >
          <LandingFeaturesIllustration className="h-auto w-full text-slate-900" />
        </figure>

        <section id="funzionalita" className="mt-24 scroll-mt-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("landing.featuresHeading")}</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{t("landing.featuresLead")}</p>
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

        <section id="come-funziona" className="mt-24 scroll-mt-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("landing.howHeading")}</h2>
            <p className="mt-3 text-base text-slate-600">{t("landing.howLead")}</p>
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

        <figure className="mx-auto mt-20 max-w-5xl overflow-hidden rounded-2xl border border-teal-200/40 bg-white/50 shadow-lg shadow-teal-900/5 ring-1 ring-white/90">
          <Image
            src="/landing/landing-lifestyle-kitchen.png"
            alt={t("landing.lifestyleImageAlt")}
            width={1376}
            height={768}
            className="h-auto w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </figure>

        <section id="perche" className="mt-24 scroll-mt-24">
          <div className="cv-card relative overflow-hidden rounded-[1.75rem] p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("landing.whyHeading")}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{t("landing.whyLead")}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  {t("landing.whyLi1")}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  {t("landing.whyLi2")}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-emerald-600">·</span>
                  {t("landing.whyLi3")}
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/registrati" className="cv-btn-primary px-6 py-3 text-base">
                  {t("landing.whyCtaPrimary")}
                </Link>
                <a href="#funzionalita" className="cv-btn-outline px-6 py-3 text-base">
                  {t("landing.whyCtaSecondary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            {t("landing.faqHeading")}
          </h2>
          <dl className="mt-8 space-y-6">
            <div className="border-b border-slate-200/80 pb-6">
              <dt className="font-semibold text-slate-900">{t("landing.faq1Q")}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{t("landing.faq1A")}</dd>
            </div>
            <div className="border-b border-slate-200/80 pb-6">
              <dt className="font-semibold text-slate-900">{t("landing.faq2Q")}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{t("landing.faq2A")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t("landing.faq3Q")}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{t("landing.faq3A")}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-24 rounded-[1.75rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-12 text-center sm:px-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("landing.finalHeading")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">{t("landing.finalLead")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/registrati" className="cv-btn-primary px-8 py-3.5 text-base">
              {t("landing.finalCtaRegister")}
            </Link>
            <Link
              href="/accedi"
              className="max-w-lg touch-manipulation rounded-2xl border-2 border-slate-300/80 bg-white/80 px-5 py-3 text-center text-sm font-semibold leading-snug text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-white active:scale-[0.97] active:border-emerald-500/50 active:bg-emerald-50/90 active:shadow-inner sm:px-8 sm:py-3.5 sm:text-base"
            >
              {t("landing.finalCtaLogin")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/40 bg-white/30 py-10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <BrandLogo />
          <p className="max-w-md text-xs leading-relaxed text-slate-500">{t("landing.footerLegal")}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <Link href="/accedi" className="cv-link">
              {t("landing.footerLogin")}
            </Link>
            <Link href="/registrati" className="cv-link">
              {t("landing.footerRegister")}
            </Link>
            <a href="#funzionalita" className="cv-link">
              {t("landing.footerFeatures")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
