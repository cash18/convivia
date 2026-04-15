/**
 * Genera un calendario iCalendar (RFC 5545) per abbonamenti Google / Apple.
 * UID stabile + DTSTAMP da ultima modifica + SEQUENCE + STATUS:CANCELLED per sync corretta.
 */

import { allDayRangeDateKeysFromDb, dateKeyToIcsYYYYMMDD } from "@/lib/calendar-all-day";
import { parseRecurrenceRule } from "@/lib/calendar-recurrence";

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
  /** Nomi partecipanti (membri casa) da aggiungere in description nel feed. */
  participantNames?: string[];
  recurrenceRule?: string | null;
  /** Promemoria display (minuti prima dell’inizio), tipicamente per task nel calendario. */
  icalAlarmMinutes?: number | null;
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
  const parts =
    ev.participantNames && ev.participantNames.length > 0
      ? ev.participantNames.map((n) => n.trim()).filter(Boolean)
      : [];
  const descParts = [ev.description?.trim() ?? "", parts.length ? `Participants: ${parts.join(", ")}` : ""].filter(
    Boolean,
  );
  const desc = descParts.length ? icsEscape(descParts.join("\n\n")) : "";
  lines.push(icsFold(`SUMMARY:${summary}`));
  if (desc) lines.push(icsFold(`DESCRIPTION:${desc}`));
  lines.push(icsFold(`LOCATION:${icsEscape(calName)}`));

  if (ev.allDay) {
    const { start, endExclusive } = allDayRangeDateKeysFromDb(ev.startsAt, ev.endsAt);
    lines.push(`DTSTART;VALUE=DATE:${dateKeyToIcsYYYYMMDD(start)}`);
    lines.push(`DTEND;VALUE=DATE:${dateKeyToIcsYYYYMMDD(endExclusive)}`);
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

  const rrule = ev.recurrenceRule?.trim();
  if (rrule && parseRecurrenceRule(rrule, ev.allDay)) {
    lines.push(icsFold(`RRULE:${rrule}`));
  }

  const alarm = ev.icalAlarmMinutes;
  if (!ev.allDay && alarm != null && alarm > 0) {
    const m = Math.min(24 * 60, Math.max(1, Math.floor(alarm)));
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:-PT${m}M`);
    lines.push("ACTION:DISPLAY");
    lines.push(icsFold(`DESCRIPTION:${summary}`));
    lines.push("END:VALARM");
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
