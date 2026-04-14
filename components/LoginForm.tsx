"use client";

import { signInWithPassword } from "@/lib/actions/login";
import { resendVerificationEmail } from "@/lib/actions/verify-email";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/case";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendOk(false);
    setPending(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setLastEmail(email.trim().toLowerCase());
    const res = await signInWithPassword(email, password);
    setPending(false);
    if ("error" in res) {
      if (res.error === "UNVERIFIED") {
        setError(
          "Devi ancora confermare l’email. Controlla la posta (anche spam) o richiedi un nuovo link qui sotto.",
        );
        return;
      }
      setError("Email o password non corretti.");
      return;
    }
    window.location.href = callbackUrl;
  }

  async function resend() {
    if (!lastEmail) return;
    setResendBusy(true);
    setResendOk(false);
    const r = await resendVerificationEmail(lastEmail);
    setResendBusy(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setResendOk(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="cv-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="cv-input"
        />
      </label>
      <button type="submit" disabled={pending} className="cv-btn-primary w-full">
        {pending ? "Accesso…" : "Accedi"}
      </button>
      {error && lastEmail && error.includes("confermare") ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-800">Non ricevi l’email?</p>
          <button
            type="button"
            disabled={resendBusy}
            onClick={() => void resend()}
            className="mt-2 text-sm font-semibold text-emerald-700 underline decoration-emerald-400/60 underline-offset-2 hover:text-emerald-900"
          >
            {resendBusy ? "Invio…" : "Rinvia email di conferma"}
          </button>
          {resendOk ? (
            <p className="mt-2 text-xs text-emerald-800">Se l’account esiste e non è verificato, abbiamo reinviato il link.</p>
          ) : null}
        </div>
      ) : null}
      <p className="text-center text-sm">
        <a href="/reimposta-password" className="cv-link">
          Password dimenticata?
        </a>
      </p>
    </form>
  );
}
