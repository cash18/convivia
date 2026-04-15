import { createTranslator } from "@/lib/i18n/server";

export default async function CasaHouseLoading() {
  const { t } = await createTranslator();
  return (
    <div className="cv-card-solid mb-4 overflow-hidden px-3 py-6 sm:px-4" aria-busy="true" aria-label={t("case.loadingHouseAria")}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200/90" />
        <div className="h-4 w-full max-w-xs animate-pulse rounded bg-slate-100" />
        <div className="flex flex-wrap gap-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-xl bg-emerald-100/80" />
          ))}
        </div>
      </div>
      <div className="mt-8 space-y-4 px-1">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100/90" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100/80" />
      </div>
    </div>
  );
}
