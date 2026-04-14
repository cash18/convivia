"use client";

import { requestPasswordReset } from "@/lib/actions/password-reset";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const r = await requestPasswordReset(email);
    setPending(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900">
        Se l’email è registrata, riceverai a breve le istruzioni. Controlla anche la cartella spam.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="email" className="cv-input" />
      </label>
      <button type="submit" disabled={pending} className="cv-btn-primary w-full">
        {pending ? "Invio…" : "Invia link"}
      </button>
    </form>
  );
}
