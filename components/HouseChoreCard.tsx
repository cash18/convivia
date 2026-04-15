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

  function formatOccurrenceDate(dateKey: string): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString(intlTag, { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <li className="cv-card-solid space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{chore.title}</h3>
          {chore.description ? <p className="mt-1 text-sm text-slate-600">{chore.description}</p> : null}
          <p className="mt-2 text-xs text-slate-500">
            {formatMessage(t("houseChores.cardEvery"), { n: String(chore.everyDays) })}
            {chore.syncCalendar ? ` · ${t("houseChores.cardCalendarOn")}` : ` · ${t("houseChores.cardCalendarOff")}`}
            <span className="text-slate-400">
              {" "}
              · {formatMessage(t("houseChores.cardCreatedBy"), { name: chore.createdByName })}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {formatMessage(t("houseChores.cardUntil"), { date: formatOccurrenceDate(chore.recurrenceEndDateKey) })}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("houseChores.cardRotationOrder")}</p>
          <ol className="mt-1 list-decimal pl-4 text-sm text-slate-800">
            {[...chore.members].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => (
              <li key={m.userId}>{m.name}</li>
            ))}
          </ol>
        </div>
        <form action={houseChoreDeleteFormAction} className="shrink-0">
          <input type="hidden" name="houseId" value={houseId} />
          <input type="hidden" name="choreId" value={chore.id} />
          <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-800">
            {t("houseChores.deleteChore")}
          </button>
        </form>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("houseChores.upcomingTitle")}</h4>
        <p className="mt-0.5 text-[11px] text-slate-500">{t("houseChores.upcomingHint")}</p>
        {chore.preview.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("houseChores.previewEmpty")}</p>
        ) : null}
        <ul className="mt-2 space-y-2">
          {chore.preview.map((row) => (
            <li
              key={row.dateKey}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
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
                    <button type="submit" className="text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900">
                      {t("houseChores.clearSwap")}
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
