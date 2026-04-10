"use client";

import { joinHouse } from "@/lib/actions/houses";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinHouseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value;
    const res = await joinHouse(code);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.push(`/casa/${res.houseId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Entra con codice invito</h2>
      <p className="text-sm text-zinc-600">Chiedi il codice a chi ha creato la casa sul portale.</p>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="code"
        required
        placeholder="Codice (es. ABC123)"
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm uppercase outline-none ring-emerald-600/30 focus:ring-2"
        autoCapitalize="characters"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-emerald-700 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
      >
        {pending ? "Verifica…" : "Unisciti"}
      </button>
    </form>
  );
}
