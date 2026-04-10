"use client";

import { createExpense } from "@/lib/actions/expenses";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string };

export function AddExpenseForm({ houseId, members }: { houseId: string; members: Member[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const participants = form.querySelectorAll<HTMLInputElement>('input[name="participants"]:checked');
    fd.delete("participants");
    participants.forEach((el) => fd.append("participants", el.value));

    const res = await createExpense(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    const checks = form.querySelectorAll<HTMLInputElement>('input[name="participants"]');
    checks.forEach((c) => {
      c.checked = true;
    });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Nuova spesa</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Descrizione (es. Bolletta luce)"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder="Importo (es. 45,50)"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <select
          name="paidById"
          required
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          defaultValue={members[0]?.id}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              Pagato da: {m.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="notes"
        placeholder="Note (opzionale)"
        rows={2}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      />
      <fieldset className="rounded-lg border border-zinc-200 bg-white p-3">
        <legend className="px-1 text-xs font-medium text-zinc-600">Ripartizione tra</legend>
        <div className="mt-2 flex flex-col gap-2">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="participants" value={m.id} defaultChecked className="rounded border-zinc-300" />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Salvataggio…" : "Aggiungi spesa"}
      </button>
    </form>
  );
}
