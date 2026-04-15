"use client";

import {
  acceptHouseOwnershipTransfer,
  declineHouseOwnershipTransfer,
} from "@/lib/actions/members";
import { useI18n } from "@/components/I18nProvider";
import { clearLastHouseOnClient } from "@/lib/last-house-preference";
import { formatMessage } from "@/lib/i18n/format-message";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HouseOwnershipTransferClient({
  token,
  houseName,
  fromName,
  isLoggedIn,
  isRecipient,
}: {
  token: string;
  houseName: string;
  fromName: string;
  isLoggedIn: boolean;
  isRecipient: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);

  async function accept() {
    setError(null);
    setPending("accept");
    const r = await acceptHouseOwnershipTransfer(token);
    setPending(null);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    router.push(`/casa/${r.houseId}/membri`);
    router.refresh();
  }

  async function decline() {
    setError(null);
    setPending("decline");
    const r = await declineHouseOwnershipTransfer(token);
    setPending(null);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    clearLastHouseOnClient();
    router.push("/case");
    router.refresh();
  }

  return (
    <div className="cv-card p-8 sm:p-9">
      <h1 className="text-2xl font-extrabold text-slate-900">{t("houseTransfer.title")}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {formatMessage(t("houseTransfer.intro"), { fromName, houseName })}
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {!isLoggedIn ? (
          <Link
            href={`/accedi?callbackUrl=${encodeURIComponent(`/trasferimento-proprieta?token=${encodeURIComponent(token)}`)}`}
            className="cv-btn-primary block w-full py-3 text-center"
          >
            {t("houseTransfer.loginToRespond")}
          </Link>
        ) : !isRecipient ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t("houseTransfer.wrongRecipient")}
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void decline()}
              className="cv-btn-outline flex-1 py-3"
            >
              {pending === "decline" ? t("houseTransfer.declinePending") : t("houseTransfer.decline")}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void accept()}
              className="cv-btn-primary flex-1 py-3"
            >
              {pending === "accept" ? t("houseTransfer.acceptPending") : t("houseTransfer.accept")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
