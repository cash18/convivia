/**
 * Ricorrenza eventi calendario: costruzione RRULE lato server e espansione finestre
 * per la griglia (solo FREQ/INTERVAL/UNTIL prodotti da noi).
 */

export type ParsedRecurrence = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  /** Limite inclusivo (fine giorno UTC dell’ultima data consentita), o null. */
  untilInclusive: Date | null;
};

const RRULE_OURS = /^FREQ=(DAILY|WEEKLY|MONTHLY)(?:;INTERVAL=(\d+))?(?:;UNTIL=([^;]+))?$/;

function parseUntilValue(raw: string, allDay: boolean): Date | null {
  const u = raw.trim();
  if (!u) return null;
  const mDate = /^(\d{4})(\d{2})(\d{2})$/.exec(u);
  if (mDate) {
    const y = Number(mDate[1]);
    const mo = Number(mDate[2]);
    const d = Number(mDate[3]);
    if (!y || !mo || !d) return null;
    return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));
  }
  const mDt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(u);
  if (mDt) {
    const y = Number(mDt[1]);
    const mo = Number(mDt[2]);
    const da = Number(mDt[3]);
    const hh = Number(mDt[4]);
    const mm = Number(mDt[5]);
    const ss = Number(mDt[6]);
    return new Date(Date.UTC(y, mo - 1, da, hh, mm, ss, allDay ? 999 : 0));
  }
  return null;
}

export function parseRecurrenceRule(
  rule: string | null | undefined,
  allDay: boolean,
): ParsedRecurrence | null {
  if (!rule?.trim()) return null;
  const m = RRULE_OURS.exec(rule.trim());
  if (!m) return null;
  const freq = m[1] as ParsedRecurrence["freq"];
  const interval = Math.max(1, Math.min(366, Number(m[2] ?? "1") || 1));
  const untilInclusive = m[3] ? parseUntilValue(m[3], allDay) : null;
  return { freq, interval, untilInclusive };
}

function formatUntilForRRule(untilDateKey: string, allDay: boolean): string {
  const compact = untilDateKey.replace(/-/g, "");
  if (!/^\d{8}$/.test(compact)) return "";
  if (allDay) return compact;
  return `${compact}T235959Z`;
}

const PRESETS: Record<string, string | undefined> = {
  daily: "FREQ=DAILY;INTERVAL=1",
  weekly: "FREQ=WEEKLY;INTERVAL=1",
  biweekly: "FREQ=WEEKLY;INTERVAL=2",
  monthly: "FREQ=MONTHLY;INTERVAL=1",
};

export function buildRecurrenceRuleFromForm(
  preset: string,
  untilDateKey: string | null,
  allDay: boolean,
): string | null {
  const base = PRESETS[preset];
  if (!base) return null;
  const u = untilDateKey?.trim();
  if (u && /^\d{4}-\d{2}-\d{2}$/.test(u)) {
    return `${base};UNTIL=${formatUntilForRRule(u, allDay)}`;
  }
  return base;
}

function addDaysUtc(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function addMonthsUtc(d: Date, months: number): Date {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + months);
  return x;
}

function advanceStart(prev: Date, parsed: ParsedRecurrence): Date {
  const { freq, interval } = parsed;
  if (freq === "DAILY") return addDaysUtc(prev, interval);
  if (freq === "WEEKLY") return addDaysUtc(prev, 7 * interval);
  return addMonthsUtc(prev, interval);
}

function fastForwardToWindow(
  start: Date,
  parsed: ParsedRecurrence,
  windowStartMs: number,
  originalEnd: Date | null,
  originalStart: Date,
  allDay: boolean,
  maxSteps: number,
): { current: Date; steps: number } {
  let current = new Date(start.getTime());
  let steps = 0;
  while (
    occurrenceEnd(current, originalEnd, originalStart, allDay).getTime() < windowStartMs &&
    steps < maxSteps
  ) {
    if (parsed.untilInclusive && current.getTime() > parsed.untilInclusive.getTime()) {
      return { current, steps };
    }
    current = advanceStart(current, parsed);
    steps++;
  }
  return { current, steps };
}

function occurrenceEnd(start: Date, originalEnd: Date | null, originalStart: Date, allDay: boolean): Date {
  if (allDay && originalEnd) {
    const spanMs = originalEnd.getTime() - originalStart.getTime();
    return new Date(start.getTime() + Math.max(0, spanMs));
  }
  if (!allDay) {
    if (originalEnd && originalEnd.getTime() > originalStart.getTime()) {
      return new Date(start.getTime() + (originalEnd.getTime() - originalStart.getTime()));
    }
    return new Date(start.getTime() + 60 * 60 * 1000);
  }
  return start;
}

export type OccurrenceSlice = { startsAt: Date; endsAt: Date | null };

/**
 * Genera occorrenze che intersecano [windowStart, windowEnd) (istanti UTC).
 */
export function expandOccurrencesInRange(
  startsAt: Date,
  endsAt: Date | null,
  allDay: boolean,
  recurrenceRule: string | null | undefined,
  windowStart: Date,
  windowEnd: Date,
): OccurrenceSlice[] {
  const parsed = parseRecurrenceRule(recurrenceRule, allDay);
  if (!parsed) {
    return [{ startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null }];
  }

  const windowStartMs = windowStart.getTime();
  const windowEndMs = windowEnd.getTime();
  const maxSteps = 800;
  const out: OccurrenceSlice[] = [];

  const { current: startCurrent, steps } = fastForwardToWindow(
    startsAt,
    parsed,
    windowStartMs,
    endsAt,
    startsAt,
    allDay,
    maxSteps,
  );
  let current = startCurrent;
  let guard = 0;

  while (guard < maxSteps && steps + guard < maxSteps * 2) {
    guard++;
    if (parsed.untilInclusive && current.getTime() > parsed.untilInclusive.getTime()) break;

    const occEnd = occurrenceEnd(current, endsAt, startsAt, allDay);
    const occStartMs = current.getTime();
    const occEndMs = occEnd.getTime();
    if (occStartMs >= windowEndMs) break;
    if (occEndMs > windowStartMs && occStartMs < windowEndMs) {
      out.push({ startsAt: new Date(current), endsAt: endsAt ? new Date(occEnd) : null });
    }
    current = advanceStart(current, parsed);
  }

  return out;
}

export function recurrenceUntilDateKeyFromRule(rule: string | null | undefined): string | null {
  if (!rule) return null;
  const m = /UNTIL=(\d{8})/.exec(rule.trim());
  if (!m?.[1]) return null;
  const c = m[1];
  return `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
}

export function recurrencePresetFromForm(formData: FormData): string {
  return String(formData.get("recurrencePreset") ?? "").trim();
}

export function recurrenceUntilFromForm(formData: FormData): string | null {
  const u = String(formData.get("recurrenceUntil") ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(u) ? u : null;
}

/** Etichette i18n (chiave `calendarPage.*`) + data fine opzionale. */
export function recurrenceListParts(
  rule: string | null | undefined,
  allDay: boolean,
): { lineKey: string; untilDateKey: string | null } | null {
  if (!rule?.trim()) return null;
  const p = parseRecurrenceRule(rule, allDay);
  if (!p) {
    return { lineKey: "calendarPage.recurrenceOther", untilDateKey: recurrenceUntilDateKeyFromRule(rule) };
  }
  let lineKey: string;
  if (p.freq === "DAILY" && p.interval === 1) lineKey = "calendarPage.recurrenceDaily";
  else if (p.freq === "WEEKLY" && p.interval === 1) lineKey = "calendarPage.recurrenceWeekly";
  else if (p.freq === "WEEKLY" && p.interval === 2) lineKey = "calendarPage.recurrenceBiweekly";
  else if (p.freq === "MONTHLY" && p.interval === 1) lineKey = "calendarPage.recurrenceMonthly";
  else lineKey = "calendarPage.recurrenceOther";
  return { lineKey, untilDateKey: recurrenceUntilDateKeyFromRule(rule) };
}
