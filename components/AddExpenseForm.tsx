"use client";

import { ExpenseNotesBody } from "@/components/ExpenseNotesBody";
import { useI18n } from "@/components/I18nProvider";
import { createExpense } from "@/lib/actions/expenses";
import { MAX_RECEIPT_BYTES } from "@/lib/expense-receipt-limits";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  fillAutoCustomEuroFields,
  parseTotalEurosToCents,
  splitIntegerEqually,
} from "@/lib/expense-custom-split";
import { formatEuroNumberForInput } from "@/lib/money";
import { runReceiptOcr } from "@/lib/receipt-ocr-browser";
import { extractEuroTotalFromDualOcr } from "@/lib/receipt-total-parse";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Member = { id: string; name: string };

export type ShoppingListExpenseMeta = { listId: string; itemIds: string[] };

function equalPercentsForIds(ids: string[]): Record<string, number> {
  if (ids.length === 0) return {};
  const parts = splitIntegerEqually(100, ids.length);
  const out: Record<string, number> = {};
  ids.forEach((id, i) => {
    out[id] = parts[i]!;
  });
  return out;
}

export function AddExpenseForm({
  houseId,
  members,
  variant = "full",
  defaultTitle,
  defaultNotes,
  shoppingListMeta,
  expenseAction,
  onSuccess,
}: {
  houseId: string;
  members: Member[];
  variant?: "full" | "compact";
  /** Default value for title (e.g. expense from shopping list). */
  defaultTitle?: string;
  defaultNotes?: string;
  shoppingListMeta?: ShoppingListExpenseMeta | null;
  /** When set (e.g. `createExpenseFromShoppingList`), hidden list fields must be present in the form. */
  expenseAction?: (hid: string, fd: FormData) => Promise<{ error?: string }>;
  onSuccess?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const compact = variant === "compact";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [splitMode, setSplitMode] = useState<"EQUAL" | "PERCENT" | "CUSTOM">("EQUAL");
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.id, true])),
  );
  const [percents, setPercents] = useState<Record<string, number>>(() =>
    equalPercentsForIds(members.map((m) => m.id)),
  );
  const [customEur, setCustomEur] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((m) => [m.id, ""])),
  );
  const [ocrBusy, setOcrBusy] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  /** In modalità CUSTOM, chi ha modificato a mano il proprio importo (non sovrascritto dall’auto). */
  const customManualRef = useRef<Set<string>>(new Set());

  const checkedIds = useMemo(
    () => members.filter((m) => checked[m.id]).map((m) => m.id),
    [members, checked],
  );
  const checkedKey = checkedIds.join("|");

  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  useEffect(() => {
    if (splitMode !== "CUSTOM") {
      customManualRef.current = new Set();
    }
  }, [splitMode]);

  useEffect(() => {
    if (compact || splitMode !== "CUSTOM") return;
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    if (total === null) return;
    for (const m of members) {
      if (!checked[m.id]) customManualRef.current.delete(m.id);
    }
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, checkedIds, memberIds, total),
    );
  }, [splitMode, checkedKey, compact, members, checked, memberIds, checkedIds]);

  useEffect(() => {
    if (splitMode !== "PERCENT") return;
    if (checkedIds.length === 0) return;
    setPercents(equalPercentsForIds(checkedIds));
  }, [splitMode, checkedKey]);

  const percentSum = useMemo(
    () => checkedIds.reduce((s, id) => s + (percents[id] ?? 0), 0),
    [checkedIds, percents],
  );
  const remainingPercent = 100 - percentSum;

  const suggestion = useMemo(() => {
    if (splitMode !== "PERCENT" || remainingPercent <= 0) return null;
    const zeroIds = checkedIds.filter((id) => (percents[id] ?? 0) === 0);
    if (zeroIds.length === 0) return null;
    const parts = splitIntegerEqually(remainingPercent, zeroIds.length);
    const labels = zeroIds.map((id, i) => {
      const name = members.find((m) => m.id === id)?.name ?? id;
      return `${name}: ${parts[i]}%`;
    });
    return { zeroIds, parts, labels };
  }, [splitMode, remainingPercent, checkedIds, percents, members]);

  function applySuggestion() {
    if (!suggestion) return;
    setPercents((prev) => {
      const next = { ...prev };
      suggestion.zeroIds.forEach((id, i) => {
        next[id] = suggestion.parts[i]!;
      });
      return next;
    });
  }

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
      setError(t("addExpenseForm.errorAmountParticipants"));
      return;
    }
    customManualRef.current = new Set();
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, checkedIds, memberIds, totalCents),
    );
    setError(null);
  }

  function onAmountInputForCustomSplit() {
    if (compact || splitMode !== "CUSTOM") return;
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    if (total === null) return;
    setCustomEur((prev) =>
      fillAutoCustomEuroFields(prev, customManualRef.current, checkedIds, memberIds, total),
    );
  }

  function onCustomEuroChange(id: string, raw: string) {
    customManualRef.current.add(id);
    const total = parseTotalEurosToCents(amountInputRef.current?.value ?? "");
    setCustomEur((prev) => {
      const next = { ...prev, [id]: raw };
      if (total === null) return next;
      return fillAutoCustomEuroFields(next, customManualRef.current, checkedIds, memberIds, total);
    });
  }

  async function scanReceiptTotal() {
    setError(null);
    const input = receiptInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setError(t("addExpenseForm.errorSelectReceipt"));
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setError(t("addExpenseForm.errorImageBig"));
      return;
    }
    setOcrBusy(true);
    try {
      const { textFull, textBottom } = await runReceiptOcr(file);
      const euro = extractEuroTotalFromDualOcr(textBottom, textFull);
      if (euro === null) {
        setError(t("addExpenseForm.errorOcrNone"));
        return;
      }
      const el = amountInputRef.current;
      if (el) el.value = formatEuroNumberForInput(euro);
      if (!compact && splitMode === "CUSTOM") {
        const total = parseTotalEurosToCents(el?.value ?? "");
        if (total !== null) {
          setCustomEur((prev) =>
            fillAutoCustomEuroFields(prev, customManualRef.current, checkedIds, memberIds, total),
          );
        }
      }
    } catch {
      setError(t("addExpenseForm.errorOcrRead"));
    } finally {
      setOcrBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!compact && splitMode === "PERCENT") {
      if (checkedIds.length === 0) {
        setError(t("addExpenseForm.errorPickParticipant"));
        return;
      }
      if (percentSum !== 100) {
        setError(formatMessage(t("addExpenseForm.errorPercentSum"), { sum: String(percentSum) }));
        return;
      }
    }
    if (!compact && splitMode === "CUSTOM") {
      if (checkedIds.length === 0) {
        setError(t("addExpenseForm.errorPickParticipant"));
        return;
      }
    }
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("splitMode", compact ? "EQUAL" : splitMode);
    fd.delete("participants");
    checkedIds.forEach((id) => fd.append("participants", id));
    if (!compact && splitMode === "PERCENT") {
      checkedIds.forEach((id) => fd.set(`pct_${id}`, String(percents[id] ?? 0)));
    }
    if (!compact && splitMode === "CUSTOM") {
      checkedIds.forEach((id) => fd.set(`eur_${id}`, customEur[id] ?? ""));
    }
    const submit = expenseAction ?? createExpense;
    const res = await submit(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSuccess?.();
    form.reset();
    setChecked(Object.fromEntries(members.map((m) => [m.id, true])));
    setPercents(equalPercentsForIds(members.map((m) => m.id)));
    customManualRef.current = new Set();
    setCustomEur(Object.fromEntries(members.map((m) => [m.id, ""])));
    setSplitMode("EQUAL");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="cv-card-solid flex h-full min-h-0 w-full min-w-0 max-w-full flex-col gap-3 p-4 sm:p-5 md:p-6"
    >
      {shoppingListMeta ? (
        <>
          <input type="hidden" name="shoppingListId" value={shoppingListMeta.listId} />
          {shoppingListMeta.itemIds.map((id) => (
            <input key={id} type="hidden" name="shoppingListItemId" value={id} />
          ))}
        </>
      ) : null}
      <h2 className="text-sm font-bold text-slate-900">{compact ? t("addExpenseForm.titleCompact") : t("addExpenseForm.titleFull")}</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder={t("addExpenseForm.placeholderTitle")}
        className="cv-input-sm"
        defaultValue={defaultTitle ?? undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          ref={amountInputRef}
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder={t("addExpenseForm.placeholderAmount")}
          className="cv-input-sm"
          onInput={onAmountInputForCustomSplit}
        />
        <select
          name="paidById"
          required
          className="cv-input-sm"
          defaultValue={members[0]?.id}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {formatMessage(t("addExpenseForm.paidBy"), { name: m.name ?? "" })}
            </option>
          ))}
        </select>
      </div>

      {!compact ? (
        <>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
            <p className="text-xs font-semibold text-slate-600">{t("addExpenseForm.receiptLabel")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("addExpenseForm.receiptLongHint")}</p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <input
                ref={receiptInputRef}
                type="file"
                name="receipt"
                accept="image/*"
                className="min-w-0 max-w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-800"
              />
              <button
                type="button"
                onClick={() => void scanReceiptTotal()}
                disabled={ocrBusy}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              >
                {ocrBusy ? t("addExpenseForm.ocrBusy") : t("addExpenseForm.ocrButton")}
              </button>
            </div>
          </div>

          {shoppingListMeta && defaultNotes ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">{t("addExpenseForm.linkedListPreviewTitle")}</p>
              <ExpenseNotesBody notes={defaultNotes} variant="compact" />
              <p className="text-[11px] leading-snug text-slate-500">{t("addExpenseForm.linkedListPreviewHint")}</p>
            </div>
          ) : null}
          <textarea
            name="notes"
            placeholder={t("addExpenseForm.placeholderNotes")}
            rows={shoppingListMeta && defaultNotes ? 4 : 2}
            className="cv-input-sm"
            defaultValue={defaultNotes ?? undefined}
          />

          <fieldset className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-600">{t("addExpenseForm.splitModeLegend")}</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="splitModeUi"
                  checked={splitMode === "EQUAL"}
                  onChange={() => setSplitMode("EQUAL")}
                  className="border-emerald-300 text-emerald-600"
                />
                {t("addExpenseForm.modeEqual")}
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="splitModeUi"
                  checked={splitMode === "PERCENT"}
                  onChange={() => setSplitMode("PERCENT")}
                  className="border-emerald-300 text-emerald-600"
                />
                {t("addExpenseForm.modePercent")}
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="splitModeUi"
                  checked={splitMode === "CUSTOM"}
                  onChange={() => setSplitMode("CUSTOM")}
                  className="border-emerald-300 text-emerald-600"
                />
                {t("addExpenseForm.modeCustom")}
              </label>
            </div>
          </fieldset>
        </>
      ) : (
        <p className="text-xs text-slate-500">{t("addExpenseForm.equalHint")}</p>
      )}

      <fieldset className="min-h-0 flex-1 rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-600">{t("addExpenseForm.participantsLegend")}</legend>
        <div className="mt-2 flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
              <label className="flex min-w-[8rem] flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checked[m.id]}
                  onChange={() => setChecked((c) => ({ ...c, [m.id]: !c[m.id] }))}
                  className="rounded border-emerald-300 text-emerald-600"
                />
                {m.name}
              </label>
              {!compact && splitMode === "PERCENT" && checked[m.id] ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={percents[m.id] ?? 0}
                    onChange={(e) => setPercent(m.id, e.target.value)}
                    className="cv-input-sm w-16 py-1 text-right tabular-nums"
                    aria-label={formatMessage(t("addExpenseForm.ariaPercentFor"), { name: m.name ?? "" })}
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              ) : null}
              {!compact && splitMode === "CUSTOM" && checked[m.id] ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customEur[m.id] ?? ""}
                    onChange={(e) => onCustomEuroChange(m.id, e.target.value)}
                    placeholder="0,00"
                    className="cv-input-sm w-24 py-1 text-right tabular-nums"
                    aria-label={formatMessage(t("addExpenseForm.ariaEuroFor"), { name: m.name ?? "" })}
                  />
                  <span className="text-xs text-slate-500">€</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {!compact && splitMode === "PERCENT" ? (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
            <p
              className={
                percentSum === 100
                  ? "font-medium text-emerald-700"
                  : remainingPercent > 0
                    ? "font-medium text-amber-800"
                    : "font-medium text-red-700"
              }
            >
              {formatMessage(t("addExpenseForm.percentSumLine"), { sum: String(percentSum) })}
              {percentSum !== 100 ? (
                <>
                  {" "}
                  {t("addExpenseForm.percentDashRemain")}{" "}
                  <span className="tabular-nums">{remainingPercent > 0 ? remainingPercent : -remainingPercent}%</span>{" "}
                  {remainingPercent > 0 ? t("addExpenseForm.percentRemaining") : t("addExpenseForm.percentOver")}
                </>
              ) : null}
            </p>
            {suggestion ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-600">
                  {t("addExpenseForm.suggestionPrefix")} {suggestion.labels.join(" · ")}
                </p>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  {t("addExpenseForm.applySuggestion")}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => checkedIds.length > 0 && setPercents(equalPercentsForIds(checkedIds))}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("addExpenseForm.redistribute100")}
            </button>
            <p className="text-slate-500">
              {t("addExpenseForm.percentFooterHint")}
            </p>
          </div>
        ) : null}
        {!compact && splitMode === "CUSTOM" ? (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <p>{t("addExpenseForm.customIntro")}</p>
            <p className="text-[11px] leading-relaxed text-slate-500">{t("addExpenseForm.customAutoHint")}</p>
            <button
              type="button"
              onClick={distributeCustomEqually}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
            >
              {t("addExpenseForm.distributeAmounts")}
            </button>
          </div>
        ) : null}
      </fieldset>

      {shoppingListMeta ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="completeShoppingList"
            defaultChecked
            className="mt-0.5 rounded border-emerald-300 text-emerald-600"
          />
          <span>{t("listsPage.completeListCheckbox")}</span>
        </label>
      ) : null}

      <button type="submit" disabled={pending} className="cv-btn-primary mt-auto shrink-0">
        {pending ? t("addExpenseForm.pending") : compact ? t("addExpenseForm.submitCompact") : t("addExpenseForm.submitFull")}
      </button>
    </form>
  );
}
