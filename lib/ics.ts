/**
 * Genera un calendario iCalendar (RFC 5545) per abbonamenti Google / Apple.
 * UID stabile + DTSTAMP da ultima modifica + SEQUENCE + STATUS:CANCELLED per sync corretta.
 */

export type IcsEventInput = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  cancelledAt: Date | null;
  calendarSequence: number;
  updatedAt: Date;
};

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function icsFold(line: string): string {
  const max = 72;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 0) {
    const chunk = rest.slice(0, max);
    parts.push(chunk);
    rest = ` ${rest.slice(max)}`;
  }
  return parts.join("\r\n");
}

function formatUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** YYYYMMDD in fuso Europe/Rome (eventi tutto il giorno). */
function formatDateValueRome(d: Date): string {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return s.replace(/-/g, "");
}

function formatDateValuePlusDays(d: Date, days: number): string {
  const x = new Date(d.getTime() + days * 86_400_000);
  return formatDateValueRome(x);
}

function buildVEvent(ev: IcsEventInput, calName: string): string[] {
  const lines: string[] = [];
  const uid = `${ev.id}@convivia-calendar`;
  const dtStamp = formatUtcStamp(ev.updatedAt);
  const seq = Math.max(0, ev.calendarSequence);

  lines.push("BEGIN:VEVENT");
  lines.push(icsFold(`UID:${uid}`));
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`SEQUENCE:${seq}`);

  if (ev.cancelledAt) {
    lines.push("STATUS:CANCELLED");
    lines.push("END:VEVENT");
    return lines;
  }

  lines.push("STATUS:CONFIRMED");
  const summary = icsEscape(ev.title);
  const desc = ev.description ? icsEscape(ev.description) : "";
  lines.push(icsFold(`SUMMARY:${summary}`));
  if (desc) lines.push(icsFold(`DESCRIPTION:${desc}`));
  lines.push(icsFold(`LOCATION:${icsEscape(calName)}`));

  if (ev.allDay) {
    const start = formatDateValueRome(ev.startsAt);
    const endExclusive = ev.endsAt
      ? formatDateValuePlusDays(ev.endsAt, 1)
      : formatDateValuePlusDays(ev.startsAt, 1);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${endExclusive}`);
  } else {
    const start = formatUtcStamp(ev.startsAt);
    let end: Date;
    if (ev.endsAt && ev.endsAt.getTime() > ev.startsAt.getTime()) {
      end = ev.endsAt;
    } else {
      end = new Date(ev.startsAt.getTime() + 60 * 60 * 1000);
    }
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${formatUtcStamp(end)}`);
  }

  lines.push("END:VEVENT");
  return lines;
}

export function buildHouseCalendarIcs(
  calName: string,
  events: IcsEventInput[],
  opts?: { relCalId?: string },
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Convivia//House calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    icsFold(`X-WR-CALNAME:${icsEscape(calName)}`),
    /** Suggerisce ai client di ripollare il feed più spesso (Google/Apple variano comunque). */
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  if (opts?.relCalId) {
    header.push(icsFold(`X-WR-RELCALID:${icsEscape(opts.relCalId)}`));
  }

  const active = events.filter((e) => !e.cancelledAt);
  const tombstones = events.filter((e) => !!e.cancelledAt);
  const body: string[] = [];
  for (const ev of active) {
    body.push(...buildVEvent(ev, calName));
  }
  for (const ev of tombstones) {
    body.push(...buildVEvent(ev, calName));
  }

  const footer = ["END:VCALENDAR"];
  return [...header, ...body, ...footer].join("\r\n") + "\r\n";
}
