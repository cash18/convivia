"use client";

import { createCalendarEvent } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddEventForm({ houseId }: { houseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Nuovo evento</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Titolo"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      />
      <textarea
        name="description"
        placeholder="Descrizione (opzionale)"
        rows={2}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="allDay" className="rounded border-zinc-300" />
        Tutto il giorno
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Inizio
          <input
            name="startsAt"
            required
            type="datetime-local"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
          Fine (opzionale)
          <input name="endsAt" type="datetime-local" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Salvataggio…" : "Aggiungi evento"}
      </button>
    </form>
  );
}
