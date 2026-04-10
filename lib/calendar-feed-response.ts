import { buildHouseCalendarIcs } from "@/lib/ics";
import { prisma } from "@/lib/prisma";

const FEED_HEADERS = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
} as const;

/**
 * Risposta ICS per abbonamenti (Google Calendar, Apple, ecc.).
 * Stessi header per `/api/calendar/feed/[token]` e `.../[token]/calendar.ics`.
 */
export async function getCalendarFeedIcsResponse(token: string): Promise<Response> {
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

  const ics = buildHouseCalendarIcs(
    `Casa: ${house.name}`,
    house.events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      allDay: e.allDay,
    })),
  );

  return new Response(ics, {
    status: 200,
    headers: {
      ...FEED_HEADERS,
      'Content-Disposition': 'inline; filename="convivia-casa.ics"',
    },
  });
}
