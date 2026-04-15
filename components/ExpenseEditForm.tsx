"use client";

import { ExpenseNotesBody } from "@/components/ExpenseNotesBody";
import { useI18n } from "@/components/I18nProvider";
import { updateExpense } from "@/lib/actions/expenses";
import { formatMessage } from "@/lib/i18n/format-message";
import { fillAutoCustomEuroFields, parseTotalEurosToCents } from "@/lib/expense-custom-split";
import { formatEuroNumberForInput } from "@/lib/money";
import { parseExpenseNotes } from "@/lib/shopping-list-expense-notes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const amountInputRef = useRef<HTMLInputElement>(null);
  const customManualRef = useRef<Set<string>>(new Set());
  const checkedRef = useRef<Record<string, boolean>>({});
  const splitModeRef = useRef<"EQUAL" | "PERCENT" | "CUSTOM">("EQUAL");

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
    const sm: "EQUAL" | "PERCENT" | "CUSTOM" =
      expense.splitMode === "PERCENT" ? "PERCENT" : expense.splitMode === "CUSTOM" ? "CUSTOM" : "EQUAL";
    splitModeRef.current = sm;
    setSplitMode(sm);
    const c: Record<string, boolean> = {};
    members.forEach((m) => {
      c[m.id] = expense.splits.some((s) => s.userId === m.id);
    });
    checkedRef.current = c;
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
    if (expense.splitMode === "CUSTOM") {
      customManualRef.current = new Set(expense.splits.map((s) => s.userId));
    } else {
      customManualRef.current = new Set();
    }
    setError(null);
  }, [open, expense, members]);

  const checkedIds = useMemo(
    () => members.filter((m) => checked[m.id]).map((m) => m.id),
    [members, checked],
  );
  const checkedKey = checkedIds.join("|");
  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  checkedRef.current = checked;
  splitModeRef.current = splitMode;

  useEffect(() => {
    if (splitMode !== "CUSTOM") {
      customManualRef.current = new Set();
    }
  }, [splitMode]);

  useEffect(() => {
    if (!open || splitModeRef.current !== "CUSTOM") return;
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    if (total === null) return;
    const ids = members.filter((m) => checkedRef.current[m.id]).map((m) => m.id);
    for (const m of members) {
      if (!checkedRef.current[m.id]) customManualRef.current.delete(m.id);
    }
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, ids, memberIds, total),
    );
  }, [open, splitMode, checkedKey, members, memberIds, expense.id]);

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
    const raw = amountInputRef.current?.value ?? "";
    const totalCents = parseTotalEurosToCents(raw);
    if (totalCents === null || checkedIds.length === 0) {
      setError(t("expenseEditForm.invalid"));
      return;
    }
    customManualRef.current = new Set();
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, checkedIds, memberIds, totalCents),
    );
    setError(null);
  }

  function onAmountInputForCustomSplit() {
    if (!open || splitMode !== "CUSTOM") return;
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    if (total === null) return;
    const ids = members.filter((m) => checkedRef.current[m.id]).map((m) => m.id);
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, ids, memberIds, total),
    );
  }

  function onCustomEuroChange(id: string, raw: string) {
    customManualRef.current.add(id);
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    setCustomEur((prev) => {
      const next = { ...prev, [id]: raw };
      if (total === null) return next;
      const ids = members.filter((m) => checkedRef.current[m.id]).map((m) => m.id);
      return fillAutoCustomEuroFields(next, customManualRef.current, ids, memberIds, total);
    });
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
                ref={amountInputRef}
                id={`edit-amount-${expense.id}`}
                name="amount"
                required
                type="text"
                inputMode="decimal"
                defaultValue={formatEuroNumberForInput(expense.amountCents / 100)}
                className="cv-input-sm"
                onInput={onAmountInputForCustomSplit}
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
                      onChange={() => {
                        customManualRef.current = new Set();
                        splitModeRef.current = "CUSTOM";
                        setSplitMode("CUSTOM");
                      }}
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
                          onChange={() =>
                            setChecked((c) => {
                              const next = { ...c, [m.id]: !c[m.id] };
                              checkedRef.current = next;
                              return next;
                            })
                          }
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
                          onChange={(e) => onCustomEuroChange(m.id, e.target.value)}
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
                  <div className="mt-2 space-y-2 text-xs text-slate-600">
                    <p className="text-[11px] leading-relaxed text-slate-500">{t("addExpenseForm.customAutoHint")}</p>
                    <button
                      type="button"
                      onClick={distributeCustomEqually}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium"
                    >
                      {t("addExpenseForm.distributeAmounts")}
                    </button>
                  </div>
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
