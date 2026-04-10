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

/** Iscrizione Google Calendar (browser / stesso account su più dispositivi). */
function googleSubscribeUrl(feedHttpsUrl: string): string {
  return `https://www.google.com/calendar/render?cid=${encodeURIComponent(feedHttpsUrl)}`;
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

export function CalendarFeedPanel({ houseId, houseName, feedHttpsUrl, canRotateToken }: Props) {
  const router = useRouter();
  const phoneKind = usePhoneKind();
  const [copied, setCopied] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const webcalUrl = feedHttpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  const googleSubscribe = googleSubscribeUrl(feedHttpsUrl);

  async function copyHttps() {
    setClipboardError(null);
    try {
      await navigator.clipboard.writeText(feedHttpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setClipboardError("Impossibile copiare. Seleziona il link nel campo sotto e copialo a mano.");
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

  const hint =
    phoneKind === "ios"
      ? "1) Apre l’app Calendario Apple per abbonarsi. 2) Utile se il primo non risponde. 3) Per account Google."
      : phoneKind === "android"
        ? "1) Apre «Apri con» (Calendario, Google, Samsung…). 2) Su Chrome spesso funziona meglio per l’abbonamento. 3) Iscrizione via Google nel browser."
        : "Stessi tre link su PC: app collegate al sistema, feed .ics, oppure Google Calendar nel browser.";

  return (
    <div className="cv-card-solid flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Calendario condiviso (gruppo)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Gli eventi di <span className="font-medium text-slate-800">{houseName}</span> sono solo per i membri
          dell&apos;app. Sotto trovi <strong>tre modi</strong> per aggiungere l&apos;abbonamento sul calendario che usi
          (iPhone, Android o PC).
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 to-white p-4 sm:p-5" aria-labelledby="quick-add-title">
        <h3 id="quick-add-title" className="text-sm font-extrabold text-slate-900">
          Abbonamento sul calendario
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{hint}</p>

        <div className="mt-4 flex flex-col gap-3">
          <a href={webcalUrl} className={btnPrimary}>
            <span aria-hidden>📅</span>
            Apri nell&apos;app calendario (consigliato)
          </a>
          <p className="text-[11px] text-slate-500">
            Usa il protocollo <strong>webcal</strong>: su iPhone apre Calendario; su Android il menu{" "}
            <strong>Apri con</strong> per l&apos;app di calendario installata.
          </p>

          <a href={feedHttpsUrl} className={btnSecondary}>
            <span aria-hidden>🔗</span>
            Apri feed HTTPS (.ics)
          </a>
          <p className="text-[11px] text-slate-500">
            Stesso calendario come file in abbonamento. Su <strong>Android</strong> con Chrome aiuta quando webcal non
            propone l&apos;app: conferma l&apos;abbonamento o scegli l&apos;app dal sistema.
          </p>

          <a href={googleSubscribe} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            <span aria-hidden>📆</span>
            Aggiungi a Google Calendar
          </a>
          <p className="text-[11px] text-slate-500">
            Si apre il browser con la pagina di iscrizione Google (feed con suffisso <strong>.ics</strong>). Accedi con
            il tuo account Google e conferma.
          </p>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
        <h4 className="text-xs font-bold text-slate-800">Sincronizzazione</h4>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          Con Google Calendar, un&apos;iscrizione dal browser vale su tutti i dispositivi con lo stesso account. Con
          Apple Calendario l&apos;abbonamento segue il tuo Apple ID.
        </p>
      </div>

      {rotateError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{rotateError}</p>
      ) : null}
      {clipboardError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{clipboardError}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Incolla manualmente (HTTPS)</p>
        <p className="text-[11px] text-slate-500">
          In molte app: <strong>Aggiungi calendario</strong> / <strong>Da URL</strong> → incolla questo indirizzo (deve
          finire in <code className="rounded bg-slate-100 px-1">.ics</code>).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={feedHttpsUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800"
            aria-label="URL feed calendario HTTPS"
          />
          <button
            type="button"
            onClick={() => void copyHttps()}
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
          >
            {copied ? "Copiato" : "Copia link"}
          </button>
        </div>
      </div>

      <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600">
        <li>
          <strong>App sul telefono</strong> — usa i primi due pulsanti nell&apos;ordine consigliato (webcal, poi HTTPS
          su Android se serve).
        </li>
        <li>
          <strong>Solo Google</strong> — terzo pulsante, oppure app Google → Impostazioni → Aggiungi calendario → Da
          URL → incolla HTTPS.
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
