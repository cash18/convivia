"use client";

import { useI18n } from "@/components/I18nProvider";
import {
  houseChoreClearSwapFormAction,
  houseChoreDeleteFormAction,
  houseChoreSwapFormAction,
} from "@/lib/actions/house-chores";
import type { ChorePreviewRow } from "@/lib/house-chore-utils";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";

export type HouseChoreCardMember = { userId: string; name: string; sortOrder: number };

export type HouseChoreCardData = {
  id: string;
  title: string;
  description: string | null;
  everyDays: number;
  syncCalendar: boolean;
  recurrenceEndDateKey: string;
  createdByName: string;
  members: HouseChoreCardMember[];
  preview: ChorePreviewRow[];
};

export function HouseChoreCard({ houseId, chore }: { houseId: string; chore: HouseChoreCardData }) {
  const { t, locale } = useI18n();
  const intlTag = intlLocaleTag(locale);
  const ordered = [...chore.members].sort((a, b) => a.sortOrder - b.sortOrder);

  function formatOccurrenceDate(dateKey: string): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString(intlTag, { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex gap-3 p-4 sm:p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-base font-bold leading-snug text-slate-900">{chore.title}</h3>
          {chore.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{chore.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              {formatMessage(t("houseChores.cardEvery"), { n: String(chore.everyDays) })}
            </span>
            <span
              className={
                chore.syncCalendar
                  ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800"
                  : "rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500"
              }
            >
              {chore.syncCalendar ? t("houseChores.cardCalendarOn") : t("houseChores.cardCalendarOff")}
            </span>
            <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
              {formatMessage(t("houseChores.cardUntilShort"), { date: formatOccurrenceDate(chore.recurrenceEndDateKey) })}
            </span>
          </div>
        </div>
        <form action={houseChoreDeleteFormAction} className="shrink-0 self-start">
          <input type="hidden" name="houseId" value={houseId} />
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-700"
          >
            {t("houseChores.deleteShort")}
          </button>
        </form>
      </div>

      <details className="group border-t border-slate-100 bg-slate-50/30 open:bg-slate-50/50">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>{formatMessage(t("houseChores.cardRotationSummary"), { n: String(ordered.length) })}</span>
            <span className="text-slate-400 transition-transform group-open:rotate-90">›</span>
          </span>
        </summary>
        <div className="space-y-2 border-t border-slate-100 px-4 pb-3 pt-2">
          <p className="text-[11px] text-slate-500">
            {formatMessage(t("houseChores.cardCreatedBy"), { name: chore.createdByName })}
          </p>
          <ol className="list-decimal space-y-0.5 pl-4 text-sm text-slate-800">
            {ordered.map((m) => (
              <li key={m.userId}>{m.name}</li>
            ))}
          </ol>
        </div>
      </details>

      <details className="group border-t border-slate-100 open:bg-white">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>
              {formatMessage(t("houseChores.cardUpcomingSummary"), {
                n: String(chore.preview.length),
              })}
            </span>
            <span className="text-slate-400 transition-transform group-open:rotate-90">›</span>
          </span>
        </summary>
        <div className="border-t border-slate-100 px-3 pb-3 pt-2 sm:px-4">
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{t("houseChores.upcomingHint")}</p>
          {chore.preview.length === 0 ? (
            <p className="text-sm text-slate-500">{t("houseChores.previewEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {chore.preview.map((row) => (
                <li
                  key={row.dateKey}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 sm:flex-row sm:items-end sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{formatOccurrenceDate(row.dateKey)}</p>
                    <p className="mt-0.5 text-sm text-emerald-900">
                      {formatMessage(t("houseChores.assigneeLine"), { name: row.assigneeName })}
                      {row.isSwapped ? (
                        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                          {t("houseChores.swappedBadge")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form action={houseChoreSwapFormAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="houseId" value={houseId} />
                      <input type="hidden" name="choreId" value={chore.id} />
                      <input type="hidden" name="occurrenceDateKey" value={row.dateKey} />
                      <label className="sr-only" htmlFor={`swap-${chore.id}-${row.dateKey}`}>
                        {t("houseChores.swapSelectLabel")}
                      </label>
                      <select
                        id={`swap-${chore.id}-${row.dateKey}`}
                        name="newAssigneeId"
                        className="cv-input-sm min-w-[10rem]"
                        defaultValue={row.assigneeId}
                      >
                        {chore.members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="cv-btn-outline touch-manipulation px-3 py-1.5 text-xs">
                        {t("houseChores.swapSubmit")}
                      </button>
                    </form>
                    {row.isSwapped ? (
                      <form action={houseChoreClearSwapFormAction}>
                        <input type="hidden" name="houseId" value={houseId} />
                        <input type="hidden" name="choreId" value={chore.id} />
                        <input type="hidden" name="occurrenceDateKey" value={row.dateKey} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                        >
                          {t("houseChores.clearSwap")}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </li>
  );
}
