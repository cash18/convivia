"use client";

import { ExpenseNotesBody } from "@/components/ExpenseNotesBody";
import { useI18n } from "@/components/I18nProvider";
import { updateExpense } from "@/lib/actions/expenses";
import { formatMessage } from "@/lib/i18n/format-message";
import { formatEuroNumberForInput } from "@/lib/money";
import { parseExpenseNotes } from "@/lib/shopping-list-expense-notes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Member = { id: string; name: string };

export type EditableExpense = {
  id: string;
  title: string;
  amountCents: number;
  paidById: string;
  notes: string | null;
  splitMode: string;
  receiptUrl: string | null;
  splits: { userId: string; shareCents: number; sharePercent: number | null }[];
};

function splitIntegerEqually(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const r = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < r ? 1 : 0));
}

function centsToInputEuro(cents: number): string {
  return formatEuroNumberForInput(cents / 100);
}

export function ExpenseEditForm({
  houseId,
  members,
  expense,
}: {
  houseId: string;
  members: Member[];
  expense: EditableExpense;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [splitMode, setSplitMode] = useState<"EQUAL" | "PERCENT" | "CUSTOM">(() => {
    if (expense.splitMode === "PERCENT") return "PERCENT";
    if (expense.splitMode === "CUSTOM") return "CUSTOM";
    return "EQUAL";
  });

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const c: Record<string, boolean> = {};
    members.forEach((m) => {
      c[m.id] = expense.splits.some((s) => s.userId === m.id);
    });
    return c;
  });

  const [percents, setPercents] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    expense.splits.forEach((s) => {
      if (s.sharePercent != null) p[s.userId] = s.sharePercent;
    });
    members.forEach((m) => {
      if (p[m.id] === undefined) p[m.id] = 0;
    });
    return p;
  });

  const [customEur, setCustomEur] = useState<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    expense.splits.forEach((s) => {
      e[s.userId] = centsToInputEuro(s.shareCents);
    });
    members.forEach((m) => {
      if (e[m.id] === undefined) e[m.id] = "";
    });
    return e;
  });

  useEffect(() => {
    if (!open) return;
    setSplitMode(expense.splitMode === "PERCENT" ? "PERCENT" : expense.splitMode === "CUSTOM" ? "CUSTOM" : "EQUAL");
    const c: Record<string, boolean> = {};
    members.forEach((m) => {
      c[m.id] = expense.splits.some((s) => s.userId === m.id);
    });
    setChecked(c);
    const p: Record<string, number> = {};
    expense.splits.forEach((s) => {
      if (s.sharePercent != null) p[s.userId] = s.sharePercent;
    });
    members.forEach((m) => {
      if (p[m.id] === undefined) p[m.id] = 0;
    });
    setPercents(p);
    const e: Record<string, string> = {};
    expense.splits.forEach((s) => {
      e[s.userId] = centsToInputEuro(s.shareCents);
    });
    members.forEach((m) => {
      if (e[m.id] === undefined) e[m.id] = "";
    });
    setCustomEur(e);
    setError(null);
  }, [open, expense, members]);

  const checkedIds = useMemo(
    () => members.filter((m) => checked[m.id]).map((m) => m.id),
    [members, checked],
  );

  const percentSum = useMemo(
    () => checkedIds.reduce((s, id) => s + (percents[id] ?? 0), 0),
    [checkedIds, percents],
  );

  const parsedNotes = useMemo(() => parseExpenseNotes(expense.notes), [expense.notes]);

  function setPercent(id: string, raw: string) {
    const v = parseInt(raw, 10);
    setPercents((p) => ({
      ...p,
      [id]: Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0,
    }));
  }

  function distributeCustomEqually() {
    const el = document.getElementById(`edit-amount-${expense.id}`) as HTMLInputElement | null;
    const raw = el?.value ?? "";
    const n = parseFloat(raw.replace(",", ".").trim());
    if (Number.isNaN(n) || n <= 0 || checkedIds.length === 0) {
      setError(t("expenseEditForm.invalid"));
      return;
    }
    const totalCents = Math.round(n * 100);
    const parts = splitIntegerEqually(totalCents, checkedIds.length);
    const next: Record<string, string> = { ...customEur };
    checkedIds.forEach((id, i) => {
      next[id] = centsToInputEuro(parts[i]!);
    });
    members.forEach((m) => {
      if (!checked[m.id]) next[m.id] = "";
    });
    setCustomEur(next);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (splitMode === "PERCENT" && percentSum !== 100) {
      setError(formatMessage(t("addExpenseForm.errorPercentSum"), { sum: percentSum }));
      return;
    }
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("splitMode", splitMode);
    fd.delete("participants");
    checkedIds.forEach((id) => fd.append("participants", id));
    if (splitMode === "PERCENT") {
      checkedIds.forEach((id) => fd.set(`pct_${id}`, String(percents[id] ?? 0)));
    }
    if (splitMode === "CUSTOM") {
      checkedIds.forEach((id) => fd.set(`eur_${id}`, customEur[id] ?? ""));
    }
    const res = await updateExpense(houseId, expense.id, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
      >
        {t("listsPage.edit")}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-expense-${expense.id}`}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 id={`edit-expense-${expense.id}`} className="text-base font-bold text-slate-900">
                {t("expenseEditForm.title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                {t("common.close")}
              </button>
            </div>
            <form onSubmit={onSubmit} encType="multipart/form-data" className="mt-4 flex flex-col gap-3">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : null}
              <input name="title" required defaultValue={expense.title} className="cv-input-sm" />
              <input
                id={`edit-amount-${expense.id}`}
                name="amount"
                required
                type="text"
                inputMode="decimal"
                defaultValue={formatEuroNumberForInput(expense.amountCents / 100)}
                className="cv-input-sm"
              />
              <select name="paidById" required className="cv-input-sm" defaultValue={expense.paidById}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatMessage(t("addExpenseForm.paidBy"), { name: m.name })}
                  </option>
                ))}
              </select>
              {parsedNotes.kind === "shopping_list" ? (
                <div className="space-y-2">
                  <ExpenseNotesBody notes={expense.notes} variant="compact" />
                  <p className="text-[11px] leading-snug text-slate-500">{t("addExpenseForm.linkedListNotesEditHint")}</p>
                </div>
              ) : null}
              <textarea
                name="notes"
                placeholder={t("expenseEditForm.notesPlaceholder")}
                rows={parsedNotes.kind === "shopping_list" ? 4 : 2}
                defaultValue={expense.notes ?? ""}
                className="cv-input-sm"
              />
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">{t("expenseForm.receiptSection")}</p>
                {expense.receiptUrl ? (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {t("expenseEditForm.openCurrentReceipt")}
                  </a>
                ) : (
                  <p className="mt-1">{t("expenseForm.receiptNone")}</p>
                )}
                <p className="mt-2">{t("expenseForm.replaceOptional")}</p>
                <input
                  type="file"
                  name="receipt"
                  accept="image/*"
                  className="mt-1 max-w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-2 file:py-1"
                />
              </div>

              <fieldset className="rounded-xl border border-slate-200/80 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-600">{t("expenseForm.splitLegend")}</legend>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={splitMode === "EQUAL"}
                      onChange={() => setSplitMode("EQUAL")}
                      className="border-emerald-300 text-emerald-600"
                    />
                    {t("addExpenseForm.modeEqual")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={splitMode === "PERCENT"}
                      onChange={() => setSplitMode("PERCENT")}
                      className="border-emerald-300 text-emerald-600"
                    />
                    {t("addExpenseForm.modePercent")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={splitMode === "CUSTOM"}
                      onChange={() => setSplitMode("CUSTOM")}
                      className="border-emerald-300 text-emerald-600"
                    />
                    {t("addExpenseForm.modeCustom")}
                  </label>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-slate-200/80 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-600">{t("expenseForm.participantsLegend")}</legend>
                <div className="mt-2 flex flex-col gap-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <label className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!checked[m.id]}
                          onChange={() => setChecked((c) => ({ ...c, [m.id]: !c[m.id] }))}
                          className="rounded border-emerald-300 text-emerald-600"
                        />
                        {m.name}
                      </label>
                      {splitMode === "PERCENT" && checked[m.id] ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={percents[m.id] ?? 0}
                          onChange={(e) => setPercent(m.id, e.target.value)}
                          className="cv-input-sm w-16 py-1 text-right"
                        />
                      ) : null}
                      {splitMode === "CUSTOM" && checked[m.id] ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customEur[m.id] ?? ""}
                          onChange={(e) => setCustomEur((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          className="cv-input-sm w-24 py-1 text-right"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                {splitMode === "PERCENT" ? (
                  <p className={`mt-2 text-xs ${percentSum === 100 ? "text-emerald-700" : "text-amber-800"}`}>
                    {formatMessage(t("addExpenseForm.percentSumLine"), { sum: percentSum })}
                  </p>
                ) : null}
                {splitMode === "CUSTOM" ? (
                  <button
                    type="button"
                    onClick={distributeCustomEqually}
                    className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium"
                  >
                    {t("addExpenseForm.distributeAmounts")}
                  </button>
                ) : null}
              </fieldset>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="cv-btn-outline flex-1">
                  {t("expenseEditForm.cancel")}
                </button>
                <button type="submit" disabled={pending} className="cv-btn-primary flex-1">
                  {pending ? t("expenseEditForm.saving") : t("expenseEditForm.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
