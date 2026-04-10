"use client";

import { rotateHouseCalendarFeed } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  houseId: string;
  houseName: string;
  feedHttpsUrl: string;
  canRotateToken: boolean;
};

export function CalendarFeedPanel({ houseId, houseName, feedHttpsUrl, canRotateToken }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState<"https" | "webcal" | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const webcalUrl = feedHttpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");

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

  return (
    <div className="cv-card-solid flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Calendario condiviso (gruppo)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Gli eventi di <span className="font-medium text-slate-800">{houseName}</span> sono visibili solo ai membri
          dell&apos;app. Per vederli anche su <strong>Google Calendar</strong> o <strong>Calendario Apple</strong> insieme
          ai tuoi impegni personali, aggiungi questo calendario come abbonamento: resta un calendario separato sul
          telefono, affiancato al tuo, con sincronizzazione automatica periodica.
        </p>
      </div>

      {rotateError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{rotateError}</p>
      ) : null}
      {clipboardError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{clipboardError}</p>
      ) : null}

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
            className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-900 hover:bg-violet-100"
          >
            {copied === "https" ? "Copiato" : "Copia"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Link per app Apple (webcal)</p>
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

      <ol className="list-decimal space-y-1.5 pl-4 text-xs text-slate-600">
        <li>
          <strong>Google Calendar</strong> (telefono o web): Impostazioni → Aggiungi calendario →{" "}
          <em>Da URL</em> → incolla il link HTTPS → il calendario della casa apparirà affiancato ai tuoi.
        </li>
        <li>
          <strong>iPhone / iPad</strong>: Impostazioni → Calendario → Account → Aggiungi account → Altro → Aggiungi
          calendario con abbonamento → incolla il link <em>webcal</em> oppure HTTPS.
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
