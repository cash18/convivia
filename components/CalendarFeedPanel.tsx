"use client";

import { rotateHouseCalendarFeed } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

type Props = {
  houseId: string;
  houseName: string;
  feedHttpsUrl: string;
  canRotateToken: boolean;
};

type PhoneKind = "ios" | "android" | "desktop";

function detectPhoneKind(): PhoneKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

/** Google Calendar: `cid` con webcal è spesso più affidabile per feed esterni. */
function googleCalendarSubscribeUrlWebcal(webcalUrl: string): string {
  return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;
}

/** Variante alternativa con URL HTTPS nel parametro `cid`. */
function googleCalendarSubscribeUrlHttps(httpsUrl: string): string {
  return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(httpsUrl)}`;
}

/**
 * Prova ad aprire l’app Google Calendar su Android invece del solo browser.
 * Se l’app non c’è, Chrome usa `browser_fallback_url` (stessa pagina web di prima).
 */
function googleCalendarAndroidAppIntent(webcalUrl: string): string {
  const web = googleCalendarSubscribeUrlWebcal(webcalUrl);
  const pathAndQuery = `calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;
  return `intent://${pathAndQuery}#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=${encodeURIComponent(web)};end`;
}

function usePhoneKind(): PhoneKind {
  const [kind, setKind] = useState<PhoneKind>("desktop");
  useLayoutEffect(() => {
    setKind(detectPhoneKind());
  }, []);
  return kind;
}

const btnPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-green-500 active:scale-[0.99]";
const btnSecondary =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50/60 active:scale-[0.99]";
const btnQuiet =
  "inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-700 transition hover:bg-slate-100";

export function CalendarFeedPanel({ houseId, houseName, feedHttpsUrl, canRotateToken }: Props) {
  const router = useRouter();
  const phoneKind = usePhoneKind();
  const [copied, setCopied] = useState<"https" | "webcal" | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const webcalUrl = feedHttpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  const googleViaWebcal = googleCalendarSubscribeUrlWebcal(webcalUrl);
  const googleViaHttps = googleCalendarSubscribeUrlHttps(feedHttpsUrl);

  async function copy(text: string, kind: "https" | "webcal") {
    setClipboardError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setClipboardError("Impossibile copiare negli appunti. Seleziona il link manualmente.");
    }
  }

  async function onRotate() {
    setRotateError(null);
    if (
      !confirm(
        "Rigenerare il link invalida i vecchi abbonamenti (Google/Apple dovranno essere aggiornati con il nuovo URL). Continuare?",
      )
    ) {
      return;
    }
    setRotating(true);
    const res = await rotateHouseCalendarFeed(houseId);
    setRotating(false);
    if (res.error) {
      setRotateError(res.error);
      return;
    }
    router.refresh();
  }

  const quickHint =
    phoneKind === "ios"
      ? "Rilevato iPhone o iPad: il tasto verde apre l’app Calendario per l’abbonamento."
      : phoneKind === "android"
        ? "Rilevato Android: il tasto verde apre il feed nel calendario del telefono (scegli l’app). Google sul web resta come opzione separata."
        : "Scegli il pulsante in base al telefono che usi di solito.";

  return (
    <div className="cv-card-solid flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Calendario condiviso (gruppo)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Gli eventi di <span className="font-medium text-slate-800">{houseName}</span> sono visibili solo ai membri
          dell&apos;app. Aggiungi il calendario sul telefono con i pulsanti qui sotto (in base a iPhone o Android), oppure
          copia il link HTTPS per un&apos;iscrizione manuale.
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 to-white p-4 sm:p-5" aria-labelledby="quick-add-title">
        <h3 id="quick-add-title" className="text-sm font-extrabold text-slate-900">
          Aggiunta rapida sul telefono
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{quickHint}</p>

        <div className="mt-4 flex flex-col gap-3">
          {phoneKind === "ios" ? (
            <>
              <a href={webcalUrl} className={btnPrimary}>
                <span aria-hidden>📅</span>
                Aggiungi al Calendario Apple (iPhone / iPad)
              </a>
              <p className="text-[11px] text-slate-500">
                Tocco singolo: si apre l&apos;app <strong>Calendario</strong> con la richiesta di abbonamento. Conferma
                con <em>Abbonati</em>.
              </p>
              <a href={googleViaWebcal} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                <span aria-hidden>📆</span>
                Preferisco Google Calendar su questo iPhone
              </a>
            </>
          ) : phoneKind === "android" ? (
            <>
              <a href={webcalUrl} className={btnPrimary}>
                <span aria-hidden>📅</span>
                Aggiungi al calendario del telefono (app)
              </a>
              <p className="text-[11px] text-slate-500">
                Si apre il menu <strong>Apri con</strong>: scegli Calendario, Google Calendar, Samsung Calendar o
                l&apos;app che usi di solito. Se non succede nulla, prova il pulsante con link HTTPS qui sotto.
              </p>
              <a href={feedHttpsUrl} className={btnSecondary}>
                <span aria-hidden>🔗</span>
                Stesso calendario — link HTTPS (scegli app)
              </a>
              <a href={googleCalendarAndroidAppIntent(webcalUrl)} className={btnSecondary}>
                <span aria-hidden>📆</span>
                Google Calendar (app Android)
              </a>
              <p className="text-[10px] leading-relaxed text-slate-500">
                Se non hai l&apos;app Google Calendar installata, si apre il browser con la stessa iscrizione.
              </p>
              <a href={googleViaWebcal} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
                Google Calendar nel browser (sito web)
              </a>
              <a href={googleViaHttps} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
                Browser — variante URL HTTPS nel link Google
              </a>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-slate-700">Non siamo su un telefono rilevato come iOS o Android:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a href={webcalUrl} className={btnPrimary}>
                  <span aria-hidden>📅</span>
                  Per iPhone / iPad (Calendario)
                </a>
                <a href={webcalUrl} className={btnSecondary}>
                  <span aria-hidden>📅</span>
                  Per Android (calendario sul telefono)
                </a>
              </div>
              <a href={googleViaWebcal} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                <span aria-hidden>📆</span>
                Android — Google Calendar nel browser
              </a>
              <a href={googleViaHttps} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
                Google Calendar — variante URL HTTPS
              </a>
            </>
          )}
        </div>
      </section>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
        <h4 className="text-xs font-bold text-slate-800">Sincronizzazione su più dispositivi</h4>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          Con <strong>Google Calendar</strong> e lo stesso account Google su Android e iPhone, aggiungi il feed{" "}
          <strong>una volta</strong>: lo rivedi su tutti i dispositivi collegati. Con <strong>Calendario Apple</strong>{" "}
          l&apos;abbonamento segue il tuo Apple ID su iPhone, iPad e Mac.
        </p>
      </div>

      {rotateError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{rotateError}</p>
      ) : null}
      {clipboardError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{clipboardError}</p>
      ) : null}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Se Google mostra errore sul link automatico: <strong>Impostazioni → Aggiungi calendario → Da URL</strong> e
        incolla il link HTTPS qui sotto.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Link abbonamento (HTTPS)</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={feedHttpsUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800"
            aria-label="URL feed calendario"
          />
          <button
            type="button"
            onClick={() => void copy(feedHttpsUrl, "https")}
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
          >
            {copied === "https" ? "Copiato" : "Copia HTTPS"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Link webcal</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={webcalUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800"
            aria-label="URL webcal"
          />
          <button
            type="button"
            onClick={() => void copy(webcalUrl, "webcal")}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            {copied === "webcal" ? "Copiato" : "Copia webcal"}
          </button>
        </div>
      </div>

      <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600">
        <li>
          <strong>Android (app Calendario / Samsung / altre)</strong> — usa il pulsante verde <em>calendario del telefono</em> o
          il link HTTPS; in alternativa nell&apos;app: <em>Aggiungi calendario</em> / <em>Abbonamento</em> → incolla HTTPS.
        </li>
        <li>
          <strong>Google Calendar</strong> — app o calendar.google.com → <em>Aggiungi calendario</em> →{" "}
          <em>Da URL</em> → incolla HTTPS.
        </li>
        <li>
          <strong>Calendario Apple</strong> — Impostazioni → Calendario → Account → Altro →{" "}
          <em>Aggiungi calendario con abbonamento</em> → incolla HTTPS o usa il pulsante webcal.
        </li>
      </ol>

      <p className="text-[11px] text-slate-500">
        Non condividere il link con chi non fa parte della casa: chiunque lo possieda può vedere gli eventi del gruppo
        nel proprio calendario esterno.
      </p>

      {canRotateToken ? (
        <button
          type="button"
          disabled={rotating}
          onClick={() => void onRotate()}
          className="self-start text-xs font-medium text-amber-800 underline decoration-amber-300 hover:text-amber-950 disabled:opacity-50"
        >
          {rotating ? "Rigenerazione…" : "Rigenera link (revoca accesso al vecchio URL)"}
        </button>
      ) : null}
    </div>
  );
}
