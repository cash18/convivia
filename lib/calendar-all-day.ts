/**
 * Eventi "tutto il giorno": stessa semantica di data civile per portale e feed .ics
 * (DTSTART/DTEND VALUE=DATE), usando il calendario UTC così coincide con lo storage
 * normalizzato a mezzogiorno UTC sul giorno scelto nel form.
 */

export function utcCalendarDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function addDaysToDateKey(key: string, days: number): string {
  const [y, m, dd] = key.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, dd + days));
  return utcCalendarDateKey(x);
}

/** Minimo tra due chiavi data YYYY-MM-DD (UTC civile). */
export function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}

/** Intervallo [start, endExclusive) in chiavi YYYY-MM-DD (confrontabile con dateKeyLocal delle celle). */
export function allDayRangeDateKeysFromDb(startsAt: Date, endsAt: Date | null): { start: string; endExclusive: string } {
  const start = utcCalendarDateKey(startsAt);
  if (endsAt && !Number.isNaN(endsAt.getTime())) {
    const lastInclusive = utcCalendarDateKey(endsAt);
    if (lastInclusive < start) {
      return { start, endExclusive: addDaysToDateKey(start, 1) };
    }
    return { start, endExclusive: addDaysToDateKey(lastInclusive, 1) };
  }
  return { start, endExclusive: addDaysToDateKey(start, 1) };
}

export function dateKeyToIcsYYYYMMDD(key: string): string {
  return key.replace(/-/g, "");
}

/** yyyy-mm-dd dal valore datetime-local (solo parte data, indipendente dal TZ del server). */
export function parseDateKeyFromDatetimeLocal(raw: string): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}
