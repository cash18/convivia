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

/** Iscrizione Google Calendar (abbonamento lato Google). */
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
  "inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-green-500 active:scale-[0.97] active:shadow-inner active:brightness-95";
const btnSecondary =
  "inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50/60 active:scale-[0.97] active:border-emerald-400/70 active:bg-emerald-100/80 active:shadow-inner";

export function CalendarFeedPanel({ houseId, houseName, feedHttpsUrl, canRotateToken }: Props) {
  const router = useRouter();
  const phoneKind = usePhoneKind();
  const [copied, setCopied] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const webcalUrl = feedHttpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  const googleSubscribe = googleSubscribeUrl(feedHttpsUrl);
  const isAndroid = phoneKind === "android";

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

  return (
    <div className="cv-card-solid flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Calendario condiviso (gruppo)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Gli eventi di <span className="font-medium text-slate-800">{houseName}</span> sono solo per i membri
          dell&apos;app. Per restare <strong>aggiornato</strong> serve un <strong>abbonamento</strong> al feed (non
          l&apos;importazione una tantum del file .ics).
        </p>
      </div>

      {isAndroid ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950"
          role="note"
        >
          <strong>Android:</strong> se apri il link <code className="rounded bg-white/80 px-1">.ics</code> con Chrome,
          spesso il sistema <strong>importa solo gli eventi attuali</strong> nel tuo calendario, <em>senza</em>{" "}
          sincronizzazione futura. Per l&apos;<strong>abbonamento</strong> usa uno di questi percorsi: Google Calendar
          (pulsante sotto), oppure nella tua app <strong>Aggiungi calendario → Da URL / Abbonamento</strong> (non
          &quot;Importa&quot;) e incolla l&apos;HTTPS qui sotto.
        </div>
      ) : null}

      <section className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 to-white p-4 sm:p-5" aria-labelledby="quick-add-title">
        <h3 id="quick-add-title" className="text-sm font-extrabold text-slate-900">
          Abbonamento (sincronizzato nel tempo)
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          {isAndroid
            ? "Su Android il modo più affidabile per un vero abbonamento è spesso Google Calendar (stesso account su telefono e web). In alternativa webcal per altre app che lo supportano come iscrizione."
            : "Scegli il percorso che corrisponde all’app che usi: Calendario Apple (webcal), oppure Google, oppure incolla l’URL nelle impostazioni dell’app (Da URL)."}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {isAndroid ? (
            <>
              <a href={googleSubscribe} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                <span aria-hidden>📆</span>
                Abbonamento con Google Calendar (consigliato su Android)
              </a>
              <p className="text-[11px] text-slate-500">
                Apre la pagina di iscrizione Google con il feed <strong>.ics</strong>. Dopo l&apos;accettazione, il
                calendario si aggiorna da solo nell&apos;app Google Calendar.
              </p>
              <a href={webcalUrl} className={btnSecondary}>
                <span aria-hidden>📅</span>
                Prova con webcal (altre app: Samsung, Simple Calendar…)
              </a>
              <p className="text-[11px] text-slate-500">
                Se l&apos;app propone <strong>Abbonati</strong> o <strong>Sottoscrivi</strong>, conferma: è
                l&apos;abbonamento. Se chiede solo &quot;Importa&quot;, annulla e usa Google o Da URL qui sotto.
              </p>
            </>
          ) : (
            <>
              <a href={webcalUrl} className={btnPrimary}>
                <span aria-hidden>📅</span>
                Apri nell&apos;app calendario (webcal)
              </a>
              <p className="text-[11px] text-slate-500">
                Su iPhone/iPad apre di solito Calendario con richiesta di <strong>abbonamento</strong>. Su PC può
                aprire Outlook o altre app collegate.
              </p>
              <a href={feedHttpsUrl} className={btnSecondary}>
                <span aria-hidden>🔗</span>
                Apri feed HTTPS (.ics)
              </a>
              <p className="text-[11px] text-slate-500">
                Utile se webcal non basta: alcuni client aprono direttamente l&apos;iscrizione. Se il browser propone
                solo importazione, usa <strong>Da URL</strong> nelle impostazioni del calendario con lo stesso link.
              </p>
              <a href={googleSubscribe} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                <span aria-hidden>📆</span>
                Aggiungi a Google Calendar
              </a>
            </>
          )}
        </div>
      </section>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
        <h4 className="text-xs font-bold text-slate-800">Da URL nell&apos;app (abbonamento manuale)</h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-700">
          <li>
            <strong>Google Calendar</strong> (app Android): menu ☰ → <em>Impostazioni</em> →{" "}
            <em>Aggiungi calendario</em> → <em>Da URL</em> → incolla l&apos;HTTPS qui sotto → Aggiungi.
          </li>
          <li>
            <strong>Samsung Calendar</strong>: Impostazioni → <em>Gestisci calendari</em> →{" "}
            <em>Aggiungi calendario</em> → scegli l&apos;opzione con <em>URL / abbonamento</em> (non importa file) →
            incolla l&apos;HTTPS.
          </li>
        </ol>
        <p className="mt-2 text-[11px] text-slate-600">
          Il link deve finire in <code className="rounded bg-white px-1 ring-1 ring-slate-200">.ics</code>. Copialo e
          incollalo nel campo «URL» dell&apos;app: così il client scarica periodicamente gli aggiornamenti.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
        <h4 className="text-xs font-bold text-slate-800">Sincronizzazione</h4>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          Con Google Calendar, l&apos;abbonamento dal browser o da <em>Da URL</em> nell&apos;app vale su tutti i
          dispositivi con lo stesso account. Con Apple Calendario l&apos;abbonamento segue il tuo Apple ID.
        </p>
      </div>

      {rotateError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{rotateError}</p>
      ) : null}
      {clipboardError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{clipboardError}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">URL per abbonamento (HTTPS)</p>
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
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            {copied ? "Copiato" : "Copia per Da URL"}
          </button>
        </div>
      </div>

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
