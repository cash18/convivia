"use client";

import { createHouse } from "@/lib/actions/houses";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateHouseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
    const res = await createHouse(name);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.push(`/casa/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Crea una nuova casa</h2>
      <p className="text-sm text-zinc-600">
        Diventerai amministratore e riceverai un codice invito da condividere con i coinquilini.
      </p>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="name"
        required
        placeholder="Nome casa (es. Via Roma 12)"
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-emerald-600/30 focus:ring-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creazione…" : "Crea casa"}
      </button>
    </form>
  );
}
