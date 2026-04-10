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
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Nome
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none ring-emerald-600/30 focus:ring-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none ring-emerald-600/30 focus:ring-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Password (min. 8 caratteri)
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none ring-emerald-600/30 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creazione account…" : "Crea account"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Hai già un account?{" "}
        <Link href="/accedi" className="font-medium text-emerald-800 underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}
