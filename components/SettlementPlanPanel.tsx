import type { SettlementStep } from "@/lib/settlement-plan";
import { formatEuroFromCents } from "@/lib/money";

export function SettlementPlanPanel({
  steps,
  compact = false,
}: {
  steps: SettlementStep[];
  compact?: boolean;
}) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">Saldi già in equilibrio</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">
          Non servono trasferimenti aggiuntivi per azzerare i conti rispetto a spese e trasferimenti già registrati.
        </p>
      </div>
    );
  }

  const list = compact ? steps.slice(0, 4) : steps;
  const more = compact && steps.length > list.length;

  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {list.map((s, i) => (
          <li
            key={`${s.fromUserId}-${s.toUserId}-${i}`}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm shadow-sm"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-slate-800">
              <span className="font-semibold text-slate-900">{s.fromName}</span>
              <span className="mx-1 text-slate-400">→</span>
              <span className="font-semibold text-slate-900">{s.toName}</span>
            </span>
            <span className="shrink-0 tabular-nums text-base font-bold text-emerald-700">
              {formatEuroFromCents(s.amountCents)}
            </span>
          </li>
        ))}
      </ol>
      {more ? (
        <p className="text-center text-xs text-slate-500">
          + {steps.length - list.length === 1 ? "un altro passaggio" : `altri ${steps.length - list.length} passaggi`}{" "}
          nella pagina Spese
        </p>
      ) : null}
      {!compact ? (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Registra ogni movimento nella sezione &quot;Trasferimento tra coinquilini&quot; qui sotto: così i saldi si
          aggiornano e la proposta si ricalcola.
        </p>
      ) : null}
    </div>
  );
}
