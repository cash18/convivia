"use client";

import { createCalendarEvent } from "@/lib/actions/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function dayKeyToDatetimeLocal(dayKey: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  return `${dayKey}T12:00`;
}

export function AddEventForm({ houseId, defaultDayKey }: { houseId: string; defaultDayKey?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startsRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dayKeyForForm = useMemo(() => {
    const u = searchParams.get("day");
    if (u && /^\d{4}-\d{2}-\d{2}$/.test(u)) return u;
    if (defaultDayKey && /^\d{4}-\d{2}-\d{2}$/.test(defaultDayKey)) return defaultDayKey;
    return null;
  }, [searchParams, defaultDayKey]);

  useEffect(() => {
    const el = startsRef.current;
    const v = dayKeyForForm ? dayKeyToDatetimeLocal(dayKeyForForm) : null;
    if (el && v) el.value = v;
  }, [dayKeyForForm]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await createCalendarEvent(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form id="nuovo-evento" onSubmit={onSubmit} className="cv-card-solid flex scroll-mt-24 flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">Nuovo evento</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Titolo"
        className="cv-input-sm"
      />
      <textarea
        name="description"
        placeholder="Descrizione (opzionale)"
        rows={2}
        className="cv-input-sm"
      />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="allDay" className="rounded border-emerald-300 text-emerald-600" />
        Tutto il giorno
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Inizio
          <input
            ref={startsRef}
            name="startsAt"
            required
            type="datetime-local"
            className="cv-input-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Fine (opzionale)
          <input name="endsAt" type="datetime-local" className="cv-input-sm" />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="cv-btn-primary"
      >
        {pending ? "Salvataggio…" : "Aggiungi evento"}
      </button>
    </form>
  );
}
