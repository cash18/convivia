import { AddEventForm } from "@/components/AddEventForm";
import { CalendarFeedSubscribeSection } from "@/components/CalendarFeedPanel";
import { HouseCalendarGrid, type CalendarEventDTO } from "@/components/HouseCalendarGrid";
import { auth } from "@/auth";
import { deleteCalendarEvent } from "@/lib/actions/calendar";
import { utcCalendarDateKey } from "@/lib/calendar-all-day";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { createTranslator } from "@/lib/i18n/server";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { canRotateCalendarFeed } from "@/lib/house-roles";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Suspense } from "react";

function formatAllDayEventListLine(
  ev: { startsAt: Date; endsAt: Date | null },
  intlTag: string,
  tf: (key: string) => string,
): string {
  const utcFmt: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const startStr = new Date(ev.startsAt).toLocaleDateString(intlTag, utcFmt);
  if (!ev.endsAt) return formatMessage(tf("calendarPage.allDayLine"), { date: startStr });
  const startU = utcCalendarDateKey(new Date(ev.startsAt));
  const endU = utcCalendarDateKey(new Date(ev.endsAt));
  if (endU === startU) return formatMessage(tf("calendarPage.allDayLine"), { date: startStr });
  const endStr = new Date(ev.endsAt).toLocaleDateString(intlTag, utcFmt);
  return `${formatMessage(tf("calendarPage.allDayLine"), { date: startStr })} — ${endStr}`;
}

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

  const { t, locale } = await createTranslator();
  const intlTag = intlLocaleTag(locale);

  const membership = await getMembershipOrRedirect(houseId, session.user.id);

  const [events, houseMembers] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { houseId, cancelledAt: null },
      orderBy: { startsAt: "asc" },
      include: {
        createdBy: { select: { name: true } },
        participants: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.houseMember.findMany({
      where: { houseId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const membersForForm = houseMembers.map((m) => ({ id: m.userId, name: m.user.name }));

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
    participantNames: ev.participants.map((p) => p.user.name),
  }));

  async function removeEventAction(formData: FormData) {
    "use server";
    const id = formData.get("eventId") as string;
    await deleteCalendarEvent(houseId, id);
  }

  const calPath = `/casa/${houseId}/calendario`;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Suspense
        fallback={<div className="cv-card-solid h-48 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />}
      >
        <AddEventForm houseId={houseId} defaultDayKey={day ?? null} members={membersForForm} />
      </Suspense>

      {feedHttpsUrl ? (
        <CalendarFeedSubscribeSection
          houseId={houseId}
          houseName={membership.house.name}
          feedHttpsUrl={feedHttpsUrl}
          canRotateToken={canRotateCalendarFeed(membership.role)}
        />
      ) : (
        <div className="cv-card-solid p-5 text-sm text-slate-600">
          {t("calendarPage.feedUrlError")}{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_APP_URL</code> {t("calendarPage.feedUrlErrorSuffix")}
        </div>
      )}

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
        <h2 className="text-lg font-bold text-slate-900">{t("calendarPage.eventListTitle")}</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("calendarPage.eventListEmpty")}</p>
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
                      ? formatAllDayEventListLine(
                          { startsAt: ev.startsAt, endsAt: ev.endsAt },
                          intlTag,
                          t,
                        )
                      : `${new Date(ev.startsAt).toLocaleString(intlTag)}`}
                    {ev.endsAt && !ev.allDay ? ` — ${new Date(ev.endsAt).toLocaleString(intlTag)}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("calendarPage.createdBy")} {ev.createdBy.name}
                  </p>
                  {ev.participants.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">{t("calendarPage.participants")}</span>{" "}
                      {ev.participants.map((p) => p.user.name).join(", ")}
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
      </section>
    </div>
  );
}
