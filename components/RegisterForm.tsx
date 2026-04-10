"use client";

import { registerUser, type RegisterState } from "@/lib/actions/register";
import Link from "next/link";
import { useActionState } from "react";
import { useEffect } from "react";

const initial: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initial);

  useEffect(() => {
    if (state.ok) {
      window.location.href = "/accedi?registrato=1";
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Nome
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="cv-input"
        />
      </label>
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
        Password (min. 8 caratteri)
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="cv-input"
        />
      </label>
      <button type="submit" disabled={pending} className="cv-btn-primary w-full">
        {pending ? "Creazione account…" : "Crea account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Hai già un account?{" "}
        <Link href="/accedi" className="cv-link">
          Accedi
        </Link>
      </p>
    </form>
  );
}
