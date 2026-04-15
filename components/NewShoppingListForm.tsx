"use client";

import { useI18n } from "@/components/I18nProvider";
import { InlineSpinner } from "@/components/InlineSpinner";
import { createShoppingList } from "@/lib/actions/lists";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewShoppingListForm({ houseId }: { houseId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
    const res = await createShoppingList(houseId, name);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
          {t("listsPage.newListLabel")}
          <input
            name="name"
            required
            disabled={pending}
            placeholder={t("listsPage.newListPlaceholder")}
            className="cv-input-sm flex-1 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="cv-btn-primary inline-flex shrink-0 items-center justify-center gap-2 sm:shrink-0"
        >
          {pending ? <InlineSpinner className="h-3.5 w-3.5 border-white/80" /> : null}
          {pending ? t("listsPage.creating") : t("listsPage.create")}
        </button>
      </div>
    </form>
  );
}
