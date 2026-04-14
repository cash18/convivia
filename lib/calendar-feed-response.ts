import { buildHouseCalendarIcs } from "@/lib/ics";
import { prisma } from "@/lib/prisma";

const FEED_HEADERS_BASE = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Pragma: "no-cache",
} as const;

/**
 * Risposta ICS per abbonamenti (Google Calendar, Apple, ecc.).
 * DTSTAMP/SEQUENCE stabili rispetto ai dati DB così i client aggiornano/rimuovono eventi correttamente.
 */
export async function getCalendarFeedIcsResponse(
  token: string,
  canonicalRequestUrl?: string,
): Promise<Response> {
  if (!token || token.length < 16) {
    return new Response("Not found", { status: 404 });
  }

  const house = await prisma.house.findUnique({
    where: { calendarFeedToken: token },
    include: {
      events: {
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!house) {
    return new Response("Not found", { status: 404 });
  }

  const icsEvents = house.events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    allDay: e.allDay,
    cancelledAt: e.cancelledAt,
    calendarSequence: e.calendarSequence,
    updatedAt: e.updatedAt,
  }));

  const ics = buildHouseCalendarIcs(
    `Casa: ${house.name}`,
    icsEvents,
    { relCalId: `${house.id}@convivia-feed` },
  );

  const maxTs = house.events.reduce((acc, e) => Math.max(acc, e.updatedAt.getTime()), 0);
  const lastModified = new Date(maxTs || house.createdAt.getTime());

  const headers: Record<string, string> = {
    ...FEED_HEADERS_BASE,
    "Last-Modified": lastModified.toUTCString(),
    ETag: `W/"${token}-${maxTs}"`,
  };
  if (canonicalRequestUrl) {
    headers.Link = `<${canonicalRequestUrl}>; rel="self"; type="text/calendar"`;
  }

  return new Response(ics, {
    status: 200,
    headers,
  });
}
