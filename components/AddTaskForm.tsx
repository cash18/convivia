"use client";

import { createTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string };

export function AddTaskForm({ houseId, members }: { houseId: string; members: Member[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await createTask(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">Nuovo compito</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Cosa va fatto?"
        className="cv-input-sm"
      />
      <textarea
        name="description"
        placeholder="Dettagli (opzionale)"
        rows={2}
        className="cv-input-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="assigneeId" className="cv-input-sm">
          <option value="">Assegna a… (nessuno)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="dueDate"
          type="datetime-local"
          className="cv-input-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="cv-btn-primary"
      >
        {pending ? "Salvataggio…" : "Aggiungi compito"}
      </button>
    </form>
  );
}
