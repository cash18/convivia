"use client";

import { createExpense } from "@/lib/actions/expenses";
import { MAX_RECEIPT_BYTES } from "@/lib/expense-receipt-limits";
import { formatEuroNumberForInput } from "@/lib/money";
import { extractEuroTotalFromReceiptText } from "@/lib/receipt-total-parse";
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

export function AddExpenseForm({ houseId, members }: { houseId: string; members: Member[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [splitMode, setSplitMode] = useState<"EQUAL" | "PERCENT">("EQUAL");
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.id, true])),
  );
  const [percents, setPercents] = useState<Record<string, number>>(() =>
    equalPercentsForIds(members.map((m) => m.id)),
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

  async function scanReceiptTotal() {
    setError(null);
    const input = receiptInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setError("Seleziona prima un’immagine dello scontrino.");
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setError("Immagine troppo grande (max 20 MB).");
      return;
    }
    setOcrBusy(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("ita+eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      const euro = extractEuroTotalFromReceiptText(text);
      if (euro === null) {
        setError("Non è stato possibile leggere un totale dallo scontrino. Inserisci l’importo a mano.");
        return;
      }
      const el = amountInputRef.current;
      if (el) el.value = formatEuroNumberForInput(euro);
    } catch {
      setError("Errore durante la lettura dell’immagine. Riprova o inserisci l’importo manualmente.");
    } finally {
      setOcrBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (splitMode === "PERCENT") {
      if (checkedIds.length === 0) {
        setError("Seleziona almeno un partecipante.");
        return;
      }
      if (percentSum !== 100) {
        setError(`Le percentuali devono sommare a 100% (attualmente ${percentSum}%).`);
        return;
      }
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
    const res = await createExpense(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    setChecked(Object.fromEntries(members.map((m) => [m.id, true])));
    setPercents(equalPercentsForIds(members.map((m) => m.id)));
    setSplitMode("EQUAL");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">Nuova spesa</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Descrizione (es. Bolletta luce)"
        className="cv-input-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          ref={amountInputRef}
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder="Importo (es. 45,50)"
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
              Pagato da: {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <p className="text-xs font-semibold text-slate-600">Scontrino (opzionale)</p>
        <p className="mt-1 text-xs text-slate-500">
          Allega una foto (immagini fino a 20 MB); puoi usare &quot;Leggi totale&quot; per compilare l&apos;importo
          (OCR, non sempre perfetto).
        </p>
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
            {ocrBusy ? "Lettura…" : "Leggi totale da scontrino"}
          </button>
        </div>
      </div>

      <textarea
        name="notes"
        placeholder="Note (opzionale)"
        rows={2}
        className="cv-input-sm"
      />

      <fieldset className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-600">Modalità ripartizione</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="splitModeUi"
              checked={splitMode === "EQUAL"}
              onChange={() => setSplitMode("EQUAL")}
              className="border-emerald-300 text-emerald-600"
            />
            Uguale tra i selezionati
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="splitModeUi"
              checked={splitMode === "PERCENT"}
              onChange={() => setSplitMode("PERCENT")}
              className="border-emerald-300 text-emerald-600"
            />
            Percentuali (somma 100%)
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-600">Ripartizione tra</legend>
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
              {splitMode === "PERCENT" && checked[m.id] ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={percents[m.id] ?? 0}
                    onChange={(e) => setPercent(m.id, e.target.value)}
                    className="cv-input-sm w-16 py-1 text-right tabular-nums"
                    aria-label={`Percentuale per ${m.name}`}
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {splitMode === "PERCENT" ? (
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
              Somma percentuali: {percentSum}%
              {percentSum !== 100 ? (
                <>
                  {" "}
                  — rimangono <span className="tabular-nums">{remainingPercent > 0 ? remainingPercent : -remainingPercent}%</span>{" "}
                  {remainingPercent > 0 ? "da assegnare" : "in eccesso"}
                </>
              ) : null}
            </p>
            {suggestion ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-600">
                  Suggerimento per chi è a 0%: {suggestion.labels.join(" · ")}
                </p>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  Applica suggerimento
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => checkedIds.length > 0 && setPercents(equalPercentsForIds(checkedIds))}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              Ripartisci il 100% in parti uguali tra i selezionati
            </button>
            <p className="text-slate-500">
              Se modifichi chi partecipa, le percentuali si aggiornano in parti uguali; poi puoi rifinirle.
            </p>
          </div>
        ) : null}
      </fieldset>

      <button type="submit" disabled={pending} className="cv-btn-primary">
        {pending ? "Salvataggio…" : "Aggiungi spesa"}
      </button>
    </form>
  );
}
