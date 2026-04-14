"use client";

import { acceptHouseEmailInvite } from "@/lib/actions/members";
import { useI18n } from "@/components/I18nProvider";
import { formatMessage } from "@/lib/i18n/format-message";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HouseInviteClient({
  token,
  houseName,
  inviteEmail,
  isLoggedIn,
  sessionEmail,
}: {
  token: string;
  houseName: string;
  inviteEmail: string;
  isLoggedIn: boolean;
  sessionEmail: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const emailsMatch =
    sessionEmail && inviteEmail.toLowerCase() === sessionEmail.toLowerCase();

  async function accept() {
    setError(null);
    setPending(true);
    const r = await acceptHouseEmailInvite(token);
    setPending(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    router.push(`/casa/${r.houseId}`);
    router.refresh();
  }

  return (
    <div className="cv-card p-8 sm:p-9">
      <h1 className="text-2xl font-extrabold text-slate-900">{t("houseInvite.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {formatMessage(t("houseInvite.intro"), { houseName, inviteEmail })}
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <p className="text-sm text-slate-600">{t("houseInvite.leadLogin")}</p>
            <Link
              href={`/accedi?callbackUrl=${encodeURIComponent(`/invito-casa?token=${encodeURIComponent(token)}`)}`}
              className="cv-btn-primary block w-full py-3 text-center"
            >
              {t("houseInvite.login")}
            </Link>
            <Link href={`/registrati?invito=${encodeURIComponent(token)}`} className="cv-btn-outline block w-full py-3 text-center">
              {t("houseInvite.register")}
            </Link>
          </>
        ) : emailsMatch ? (
          <button type="button" disabled={pending} onClick={() => void accept()} className="cv-btn-primary w-full py-3">
            {pending ? t("houseInvite.acceptPending") : t("houseInvite.accept")}
          </button>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {formatMessage(t("houseInvite.wrongAccount"), {
              sessionEmail: sessionEmail ?? "",
              inviteEmail,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
