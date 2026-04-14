"use client";

import { resetPasswordWithToken } from "@/lib/actions/password-reset";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const pwd = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    setPending(true);
    const r = await resetPasswordWithToken(token, pwd);
    setPending(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    router.push("/accedi?reimpostata=1");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Nuova password
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="cv-input" />
      </label>
      <button type="submit" disabled={pending} className="cv-btn-primary w-full">
        {pending ? "Salvataggio…" : "Salva password"}
      </button>
    </form>
  );
}
