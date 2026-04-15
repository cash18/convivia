"use client";

import { useI18n } from "@/components/I18nProvider";
import { joinHouse } from "@/lib/actions/houses";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinHouseForm({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
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
    <form
      onSubmit={onSubmit}
      className={
        embedded
          ? "flex flex-col gap-3"
          : "cv-card-solid flex flex-col gap-3 p-5 sm:p-6"
      }
    >
      <h2 className="text-lg font-bold text-slate-900">{t("forms.joinTitle")}</h2>
      <p className="text-sm text-slate-600">{t("forms.joinIntro")}</p>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="code"
        required
        placeholder={t("forms.joinPlaceholder")}
        className="cv-input-sm uppercase"
        autoCapitalize="characters"
      />
      <button type="submit" disabled={pending} className="cv-btn-outline w-full">
        {pending ? t("forms.joinVerifying") : t("forms.joinSubmit")}
      </button>
    </form>
  );
}
