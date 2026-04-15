"use client";

import { useI18n } from "@/components/I18nProvider";
import { parseExpenseNotes } from "@/lib/shopping-list-expense-notes";

export function ExpenseNotesBody({
  notes,
  variant = "default",
}: {
  notes: string | null;
  variant?: "default" | "compact";
}) {
  const { t } = useI18n();
  const parsed = parseExpenseNotes(notes);

  if (parsed.kind === "plain") {
    if (!parsed.text.trim()) return null;
    return (
      <p className={`text-slate-600 ${variant === "compact" ? "text-xs leading-relaxed" : "mt-1 text-sm whitespace-pre-wrap"}`}>
        {parsed.text}
      </p>
    );
  }

  const box =
    variant === "compact"
      ? "rounded-lg border border-emerald-200/70 bg-emerald-50/40 px-2.5 py-2"
      : "mt-1 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white px-3 py-3 sm:px-4 sm:py-3.5";

  return (
    <div className={box}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{t("expensesPage.notesFromListBadge")}</p>
      <p className={`mt-1.5 font-semibold text-slate-900 ${variant === "compact" ? "text-xs" : "text-sm"}`}>{parsed.headline}</p>
      {parsed.items.length > 0 ? (
        <>
          <p className={`mt-2 font-semibold text-slate-600 ${variant === "compact" ? "text-[10px]" : "text-xs"}`}>
            {t("expensesPage.notesFromListItems")}
          </p>
          <ul
            className={`mt-1.5 list-none space-y-1 ${variant === "compact" ? "text-xs" : "text-sm"}`}
            aria-label={t("expensesPage.notesFromListItems")}
          >
            {parsed.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-slate-800">
                <span className="font-bold text-emerald-600" aria-hidden>
                  ·
                </span>
                <span className="min-w-0 flex-1 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-xs italic text-slate-500">{t("expensesPage.notesFromListNoItems")}</p>
      )}
    </div>
  );
}
