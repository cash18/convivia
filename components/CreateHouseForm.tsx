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
    <form onSubmit={onSubmit} className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Crea una nuova casa</h2>
      <p className="text-sm text-slate-600">
        Diventerai amministratore e riceverai un codice invito da condividere con i coinquilini.
      </p>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="name"
        required
        placeholder="Nome casa (es. Via Roma 12)"
        className="cv-input-sm"
      />
      <button type="submit" disabled={pending} className="cv-btn-primary">
        {pending ? "Creazione…" : "Crea casa"}
      </button>
    </form>
  );
}
