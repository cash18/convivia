"use client";

import { useI18n } from "@/components/I18nProvider";
import { createMoneyTransfer } from "@/lib/actions/transfers";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string };

export function AddMoneyTransferForm({ houseId, members }: { houseId: string; members: Member[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await createMoneyTransfer(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  if (members.length < 2) {
    return <p className="text-xs text-slate-500">{t("moneyTransferForm.needTwoMembers")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          {t("moneyTransferForm.from")}
          <select name="fromUserId" required className="cv-input-sm">
            <option value="">—</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          {t("moneyTransferForm.to")}
          <select name="toUserId" required className="cv-input-sm">
            <option value="">—</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        {t("moneyTransferForm.amount")}
        <input
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder={t("moneyTransferForm.amountPlaceholder")}
          className="cv-input-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        {t("moneyTransferForm.note")}
        <input name="note" type="text" placeholder={t("moneyTransferForm.note")} className="cv-input-sm" />
      </label>
      <button type="submit" disabled={pending} className="cv-btn-primary text-sm">
        {pending ? t("moneyTransferForm.submitting") : t("moneyTransferForm.submit")}
      </button>
    </form>
  );
}
