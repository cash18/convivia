"use client";

import { registerUser, type RegisterState } from "@/lib/actions/register";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useActionState } from "react";
import { useEffect } from "react";

const initial: RegisterState = {};

export function RegisterForm({
  inviteToken,
  lockedEmail,
}: {
  inviteToken?: string | null;
  lockedEmail?: string | null;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(registerUser, initial);

  useEffect(() => {
    if (state.ok) {
      window.location.href = "/accedi?registrato=1";
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        {t("authForms.name")}
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="cv-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        {t("authForms.email")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="cv-input"
          defaultValue={lockedEmail ?? undefined}
          readOnly={!!lockedEmail}
          aria-readonly={!!lockedEmail}
        />
      </label>
      {lockedEmail ? (
        <p className="text-xs text-slate-500">
          {t("authForms.lockedEmailHint")}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        {t("authForms.passwordMinLabel")}
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
        {pending ? t("authForms.registerPending") : t("authForms.registerSubmit")}
      </button>
      <p className="text-center text-sm text-slate-600">
        {t("authForms.hasAccount")}{" "}
        <Link href="/accedi" className="cv-link">
          {t("authForms.loginLink")}
        </Link>
      </p>
    </form>
  );
}
