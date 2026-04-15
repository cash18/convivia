"use client";

import { useI18n } from "@/components/I18nProvider";
import { allDayRangeDateKeysFromDb } from "@/lib/calendar-all-day";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type CalendarEventDTO = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  createdByName: string;
  participantNames: string[];
};

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
}

function startOfMondayWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - mondayOffset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getWeekDays(anchor: Date): Date[] {
  const mon = startOfMondayWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const c = new Date(mon);
    c.setDate(mon.getDate() + i);
    return c;
  });
}

function getMonthGrid(monthFirst: Date): Date[] {
  const y = monthFirst.getFullYear();
  const m = monthFirst.getMonth();
  const first = new Date(y, m, 1);
  const day = first.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayOffset);
  gridStart.setHours(0, 0, 0, 0);
  return Array.from({ length: 42 }, (_, i) => {
    const c = new Date(gridStart);
    c.setDate(gridStart.getDate() + i);
    return c;
  });
}

function allDayRangeKeys(ev: CalendarEventDTO): { start: string; endExclusive: string } {
  return allDayRangeDateKeysFromDb(new Date(ev.startsAt), ev.endsAt ? new Date(ev.endsAt) : null);
}

function eventOnLocalDay(ev: CalendarEventDTO, day: Date): boolean {
  const key = dateKeyLocal(day);
  if (ev.allDay) {
    const r = allDayRangeKeys(ev);
    return key >= r.start && key < r.endExclusive;
  }
  const s = new Date(ev.startsAt);
  return dateKeyLocal(s) === key;
}

function eventsForDay(evts: CalendarEventDTO[], day: Date): CalendarEventDTO[] {
  return evts
    .filter((ev) => eventOnLocalDay(ev, day))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isToday(d: Date): boolean {
  const t = new Date();
  return dateKeyLocal(d) === dateKeyLocal(t);
}

function parseDayKey(key: string | null): string | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  return key;
}

type ViewMode = "month" | "week";

type HouseCalendarGridProps = {
  events: CalendarEventDTO[];
  calendarioPath: string;
  removeEventAction: (formData: FormData) => Promise<void>;
  initialDayKey?: string | null;
};

export function HouseCalendarGrid({
  events,
  calendarioPath,
  removeEventAction,
  initialDayKey,
}: HouseCalendarGridProps) {
  const { t, locale } = useI18n();
  const intlTag = intlLocaleTag(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayFromUrl = parseDayKey(searchParams.get("day"));

  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(() =>
    parseDayKey(initialDayKey ?? null) ?? dayFromUrl ?? dateKeyLocal(new Date()),
  );

  const weekdayShortLabels = useMemo(() => {
    const anchor = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return d.toLocaleDateString(intlTag, { weekday: "short" });
    });
  }, [intlTag]);

  const formatDayHeader = useCallback(
    (d: Date) => d.toLocaleDateString(intlTag, { weekday: "short", day: "numeric", month: "short" }),
    [intlTag],
  );

  const formatMonthTitle = useCallback(
    (d: Date) => d.toLocaleDateString(intlTag, { month: "long", year: "numeric" }),
    [intlTag],
  );

  useEffect(() => {
    const d = parseDayKey(initialDayKey ?? null) ?? dayFromUrl;
    if (d) setSelectedDayKey(d);
  }, [initialDayKey, dayFromUrl]);

  const selectDay = useCallback(
    (key: string) => {
      setSelectedDayKey(key);
      router.replace(`${calendarioPath}?day=${key}`, { scroll: false });
    },
    [router, calendarioPath],
  );

  const monthFirst = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const monthGrid = useMemo(() => getMonthGrid(monthFirst), [monthFirst]);
  const weekDays = useMemo(() => getWeekDays(cursor), [cursor]);

  const selectedDate = useMemo(() => {
    if (!selectedDayKey) return null;
    const [y, m, d] = selectedDayKey.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [selectedDayKey]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsForDay(events, selectedDate);
  }, [events, selectedDate]);

  const weekLabel = useMemo(() => {
    const a = weekDays[0]!;
    const b = weekDays[6]!;
    const sameMonth = a.getMonth() === b.getMonth();
    const left = a.toLocaleDateString(intlTag, { day: "numeric", month: "short" });
    const right = sameMonth
      ? b.toLocaleDateString(intlTag, { day: "numeric", month: "short", year: "numeric" })
      : b.toLocaleDateString(intlTag, { day: "numeric", month: "short", year: "numeric" });
    return `${left} — ${right}`;
  }, [weekDays, intlTag]);

  function goToday() {
    const td = new Date();
    setCursor(td);
    selectDay(dateKeyLocal(td));
  }

  function navPrev() {
    setCursor((c) => {
      if (view === "month") {
        return new Date(c.getFullYear(), c.getMonth() - 1, 1);
      }
      const n = new Date(c);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }

  function navNext() {
    setCursor((c) => {
      if (view === "month") {
        return new Date(c.getFullYear(), c.getMonth() + 1, 1);
      }
      const n = new Date(c);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }

  return (
    <section className="cv-card-solid overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t("calendarGrid.viewTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {view === "month" ? formatMonthTitle(monthFirst) : weekLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView("month")}
              className={
                view === "month"
                  ? "rounded-md bg-emerald-600 px-2.5 py-1 text-white"
                  : "rounded-md px-2.5 py-1 text-slate-600 hover:bg-slate-50"
              }
            >
              {t("calendarGrid.month")}
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={
                view === "week"
                  ? "rounded-md bg-emerald-600 px-2.5 py-1 text-white"
                  : "rounded-md px-2.5 py-1 text-slate-600 hover:bg-slate-50"
              }
            >
              {t("calendarGrid.week")}
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("calendarGrid.today")}
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={navPrev}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
              aria-label={t("calendarGrid.prevPeriod")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={navNext}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
              aria-label={t("calendarGrid.nextPeriod")}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-px rounded-xl border border-slate-200/80 bg-slate-200/80 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {weekdayShortLabels.map((d) => (
              <div key={d} className="bg-slate-50 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-b-xl border border-t-0 border-slate-200/80 bg-slate-200/80">
            {monthGrid.map((day) => {
              const inMonth = isSameMonth(day, monthFirst);
              const dayEvts = eventsForDay(events, day);
              const today = isToday(day);
              const key = dateKeyLocal(day);
              const selected = selectedDayKey === key;
              return (
                <button
                  type="button"
                  key={`m-${key}`}
                  onClick={() => selectDay(key)}
                  className={`min-h-[5rem] w-full bg-white p-1.5 text-left sm:min-h-[6rem] sm:p-2 ${
                    inMonth ? "" : "opacity-45"
                  } ${today ? "ring-1 ring-inset ring-emerald-400" : ""} ${
                    selected ? "ring-2 ring-inset ring-emerald-500" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-semibold tabular-nums ${
                      today ? "text-emerald-700" : inMonth ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {dayEvts.slice(0, 3).map((ev) => (
                      <li
                        key={ev.id}
                        className="truncate rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-medium text-emerald-900 sm:text-[11px]"
                        title={`${ev.title}${ev.allDay ? "" : ` · ${new Date(ev.startsAt).toLocaleTimeString(intlTag, { hour: "2-digit", minute: "2-digit" })}`}`}
                      >
                        {!ev.allDay ? (
                          <span className="tabular-nums text-emerald-600">
                            {new Date(ev.startsAt).toLocaleTimeString(intlTag, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                          </span>
                        ) : null}
                        {ev.title}
                      </li>
                    ))}
                    {dayEvts.length > 3 ? (
                      <li className="text-[10px] text-slate-500">
                        {formatMessage(t("calendarGrid.moreEvents"), { n: dayEvts.length - 3 })}
                      </li>
                    ) : null}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-slate-200/80">
          <div className="grid min-w-0 grid-cols-7 gap-px bg-slate-200/80 p-0">
            {weekDays.map((day) => {
              const dayEvts = eventsForDay(events, day);
              const today = isToday(day);
              const key = dateKeyLocal(day);
              const selected = selectedDayKey === key;
              return (
                <div
                  key={`w-${key}`}
                  className={`flex min-h-[12rem] flex-col border-slate-100 bg-white sm:min-h-[16rem] ${
                    today ? "ring-1 ring-inset ring-emerald-400" : ""
                  } ${selected ? "ring-2 ring-inset ring-emerald-500" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => selectDay(key)}
                    className={`border-b border-slate-100 px-2 py-2 text-center text-xs font-semibold ${
                      today ? "bg-emerald-50 text-emerald-800" : "bg-slate-50/90 text-slate-700"
                    }`}
                  >
                    {formatDayHeader(day)}
                  </button>
                  <ul className="flex flex-1 flex-col gap-1.5 p-2">
                    {dayEvts.map((ev) => (
                      <li
                        key={ev.id}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/90 px-2 py-1.5 text-xs text-emerald-950"
                      >
                        <p className="font-semibold leading-tight">{ev.title}</p>
                        <p className="mt-0.5 text-[10px] text-emerald-800/90">
                          {ev.allDay
                            ? t("calendarGrid.allDay")
                            : new Date(ev.startsAt).toLocaleTimeString(intlTag, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          {ev.endsAt && !ev.allDay
                            ? ` — ${new Date(ev.endsAt).toLocaleTimeString(intlTag, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && selectedDayKey ? (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4 sm:px-5">
          <h3 className="text-sm font-bold text-slate-900">
            {t("calendarGrid.eventsOn")}{" "}
            {selectedDate.toLocaleDateString(intlTag, { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t("calendarGrid.dayPanelHint")}{" "}
            <a href="#nuovo-evento" className="cv-link font-medium">
              {t("calendarForm.title")}
            </a>{" "}
            {t("calendarGrid.dayPanelHintEnd")}
          </p>
          {selectedDayEvents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t("calendarGrid.noEventsDay")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {selectedDayEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{ev.title}</p>
                    {ev.description ? <p className="mt-1 text-xs text-slate-600">{ev.description}</p> : null}
                    <p className="mt-1 text-xs text-slate-500">
                      {ev.allDay
                        ? t("calendarGrid.allDay")
                        : new Date(ev.startsAt).toLocaleString(intlTag)}
                      {ev.endsAt && !ev.allDay
                        ? ` — ${new Date(ev.endsAt).toLocaleTimeString(intlTag)}`
                        : ""}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t("calendarGrid.createdBy")} {ev.createdByName}
                    </p>
                    {ev.participantNames.length > 0 ? (
                      <p className="mt-1 text-[10px] text-slate-600">
                        <span className="font-medium text-slate-700">{t("calendarGrid.participants")}</span>{" "}
                        {ev.participantNames.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <form action={removeEventAction}>
                    <input type="hidden" name="eventId" value={ev.id} />
                    <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-800">
                      {t("calendarGrid.delete")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
