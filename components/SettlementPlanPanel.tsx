"use client";

import { useI18n } from "@/components/I18nProvider";
import { formatMessage } from "@/lib/i18n/format-message";
import type { SettlementStep } from "@/lib/settlement-plan";
import { formatEuroFromCents } from "@/lib/money";

export function SettlementPlanPanel({
  steps,
  compact = false,
}: {
  steps: SettlementStep[];
  compact?: boolean;
}) {
  const { t } = useI18n();

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">{t("settlement.balancedTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">{t("settlement.balancedBody")}</p>
      </div>
    );
  }

  const list = compact ? steps.slice(0, 4) : steps;
  const more = compact && steps.length > list.length;
  const moreCount = steps.length - list.length;

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
          {moreCount === 1 ? t("settlement.moreOne") : formatMessage(t("settlement.moreMany"), { n: moreCount })}
        </p>
      ) : null}
      {!compact ? (
        <p className="text-[11px] leading-relaxed text-slate-500">{t("settlement.registerHint")}</p>
      ) : null}
    </div>
  );
}
