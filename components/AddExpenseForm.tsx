"use client";

import { useI18n } from "@/components/I18nProvider";
import { createExpense } from "@/lib/actions/expenses";
import { MAX_RECEIPT_BYTES } from "@/lib/expense-receipt-limits";
import { formatMessage } from "@/lib/i18n/format-message";
import { formatEuroNumberForInput } from "@/lib/money";
import { runReceiptOcr } from "@/lib/receipt-ocr-browser";
import { extractEuroTotalFromDualOcr } from "@/lib/receipt-total-parse";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Member = { id: string; name: string };

function splitIntegerEqually(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const r = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < r ? 1 : 0));
}

function equalPercentsForIds(ids: string[]): Record<string, number> {
  if (ids.length === 0) return {};
  const parts = splitIntegerEqually(100, ids.length);
  const out: Record<string, number> = {};
  ids.forEach((id, i) => {
    out[id] = parts[i]!;
  });
  return out;
}

function centsToInputEuro(cents: number): string {
  return formatEuroNumberForInput(cents / 100);
}

export function AddExpenseForm({
  houseId,
  members,
  variant = "full",
}: {
  houseId: string;
  members: Member[];
  variant?: "full" | "compact";
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

  const checkedIds = useMemo(
    () => members.filter((m) => checked[m.id]).map((m) => m.id),
    [members, checked],
  );
  const checkedKey = checkedIds.join("|");

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
    const normalized = raw.replace(",", ".").trim();
    const n = parseFloat(normalized);
    if (Number.isNaN(n) || n <= 0 || checkedIds.length === 0) {
      setError(t("addExpenseForm.errorAmountParticipants"));
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
    const res = await createExpense(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    setChecked(Object.fromEntries(members.map((m) => [m.id, true])));
    setPercents(equalPercentsForIds(members.map((m) => m.id)));
    setCustomEur(Object.fromEntries(members.map((m) => [m.id, ""])));
    setSplitMode("EQUAL");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="cv-card-solid flex h-full min-h-0 flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">{compact ? t("addExpenseForm.titleCompact") : t("addExpenseForm.titleFull")}</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder={t("addExpenseForm.placeholderTitle")}
        className="cv-input-sm"
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={receiptInputRef}
                type="file"
                name="receipt"
                accept="image/*"
                className="max-w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-800"
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

          <textarea
            name="notes"
            placeholder={t("addExpenseForm.placeholderNotes")}
            rows={2}
            className="cv-input-sm"
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
                    onChange={(e) => setCustomEur((prev) => ({ ...prev, [m.id]: e.target.value }))}
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

      <button type="submit" disabled={pending} className="cv-btn-primary mt-auto shrink-0">
        {pending ? t("addExpenseForm.pending") : compact ? t("addExpenseForm.submitCompact") : t("addExpenseForm.submitFull")}
      </button>
    </form>
  );
}
