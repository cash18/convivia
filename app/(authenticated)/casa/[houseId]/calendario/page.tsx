import { AddEventForm } from "@/components/AddEventForm";
import { auth } from "@/auth";
import { deleteCalendarEvent } from "@/lib/actions/calendar";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  await getMembershipOrRedirect(houseId, session.user.id);

  const events = await prisma.calendarEvent.findMany({
    where: { houseId },
    orderBy: { startsAt: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  async function removeEventAction(formData: FormData) {
    "use server";
    const id = formData.get("eventId") as string;
    await deleteCalendarEvent(houseId, id);
  }

  return (
    <div className="space-y-8">
      <AddEventForm houseId={houseId} />

      <section>
        <h2 className="text-lg font-bold text-slate-900">Eventi</h2>
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
