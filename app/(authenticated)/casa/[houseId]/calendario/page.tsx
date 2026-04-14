import { AddEventForm } from "@/components/AddEventForm";
import { CalendarFeedPanel } from "@/components/CalendarFeedPanel";
import { HouseCalendarGrid, type CalendarEventDTO } from "@/components/HouseCalendarGrid";
import { auth } from "@/auth";
import { deleteCalendarEvent } from "@/lib/actions/calendar";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { canRotateCalendarFeed } from "@/lib/house-roles";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Suspense } from "react";

export default async function CalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ houseId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { houseId } = await params;
  const { day } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getMembershipOrRedirect(houseId, session.user.id);

  const events = await prisma.calendarEvent.findMany({
    where: { houseId },
    orderBy: { startsAt: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const feedHttpsUrl =
    baseUrl && membership.house.calendarFeedToken
      ? `${baseUrl}/api/calendar/feed/${membership.house.calendarFeedToken}/calendar.ics`
      : "";

  const gridEvents: CalendarEventDTO[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    startsAt: ev.startsAt.toISOString(),
    endsAt: ev.endsAt?.toISOString() ?? null,
    allDay: ev.allDay,
    createdByName: ev.createdBy.name,
  }));

  async function removeEventAction(formData: FormData) {
    "use server";
    const id = formData.get("eventId") as string;
    await deleteCalendarEvent(houseId, id);
  }

  const calPath = `/casa/${houseId}/calendario`;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense
          fallback={<div className="cv-card-solid h-48 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />}
        >
          <AddEventForm houseId={houseId} defaultDayKey={day ?? null} />
        </Suspense>
        {feedHttpsUrl ? (
          <CalendarFeedPanel
            houseId={houseId}
            houseName={membership.house.name}
            feedHttpsUrl={feedHttpsUrl}
            canRotateToken={canRotateCalendarFeed(membership.role)}
          />
        ) : (
          <div className="cv-card-solid p-5 text-sm text-slate-600">
            Impossibile costruire il link del calendario (host sconosciuto). In produzione usa un dominio pubblico o
            imposta <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_APP_URL</code> e ricarica.
          </div>
        )}
      </div>

      <Suspense
        fallback={<div className="cv-card-solid h-80 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />}
      >
        <HouseCalendarGrid
          events={gridEvents}
          calendarioPath={calPath}
          removeEventAction={removeEventAction}
          initialDayKey={day ?? null}
        />
      </Suspense>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Elenco eventi</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessun evento. Aggiungi il primo sopra.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="cv-card-solid flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{ev.title}</p>
                  {ev.description ? <p className="mt-1 text-sm text-slate-600">{ev.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {ev.allDay
                      ? `Giornata intera · ${new Date(ev.startsAt).toLocaleDateString("it-IT")}`
                      : `${new Date(ev.startsAt).toLocaleString("it-IT")}`}
                    {ev.endsAt && !ev.allDay ? ` — ${new Date(ev.endsAt).toLocaleString("it-IT")}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">Creato da {ev.createdBy.name}</p>
                </div>
                <form action={removeEventAction}>
                  <input type="hidden" name="eventId" value={ev.id} />
                  <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-800">
                    Elimina
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
