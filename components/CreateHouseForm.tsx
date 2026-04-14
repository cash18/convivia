"use client";

import { useI18n } from "@/components/I18nProvider";
import { createHouse } from "@/lib/actions/houses";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateHouseForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
    const res = await createHouse(name);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.push(`/casa/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{t("forms.createHouseTitle")}</h2>
      <p className="text-sm text-slate-600">{t("forms.createHouseIntro")}</p>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="name"
        required
        placeholder={t("forms.createHousePlaceholder")}
        className="cv-input-sm"
      />
      <button type="submit" disabled={pending} className="cv-btn-primary">
        {pending ? t("forms.createHousePending") : t("forms.createHouseSubmit")}
      </button>
    </form>
  );
}
