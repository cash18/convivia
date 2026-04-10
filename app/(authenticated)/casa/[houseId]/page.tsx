import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { formatEuroFromCents } from "@/lib/money";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CasaDashboardPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  await getMembershipOrRedirect(houseId, session.user.id);

  const [balances, upcoming, openTasks, recentExpenses] = await Promise.all([
    computeMemberBalances(houseId),
    prisma.calendarEvent.findMany({
      where: { houseId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { houseId, status: "TODO" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { houseId },
      orderBy: { expenseDate: "desc" },
      take: 5,
      include: { paidBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-bold text-slate-900">Saldi indicativi</h2>
        <p className="text-xs text-slate-500">
          Positivo = hai pagato più della tua quota; negativo = devi ancora &quot;rimetterti in pari&quot; rispetto a
          quanto hai consumato.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {balances.map((b) => (
            <li key={b.userId} className="cv-card-solid flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-semibold text-slate-800">{b.name}</span>
              <span className={b.balanceCents >= 0 ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                {formatEuroFromCents(b.balanceCents)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm">
            Vai alle spese →
          </Link>
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-bold text-slate-900">Prossimi eventi</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nessun evento futuro.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((ev) => (
                <li key={ev.id} className="cv-card-solid px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">{ev.title}</span>
                  <p className="text-xs text-slate-500">
                    {ev.allDay
                      ? new Date(ev.startsAt).toLocaleDateString("it-IT")
                      : new Date(ev.startsAt).toLocaleString("it-IT")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3">
            <Link href={`/casa/${houseId}/calendario`} className="cv-link text-sm">
              Calendario completo →
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Compiti aperti</h2>
          {openTasks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nessun compito in sospeso.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="cv-card-solid px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">{t.title}</span>
                  <p className="text-xs text-slate-500">
                    {t.assignee ? `Assegnato a ${t.assignee.name}` : "Non assegnato"}
                    {t.dueDate ? ` · scadenza ${new Date(t.dueDate).toLocaleString("it-IT")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3">
            <Link href={`/casa/${houseId}/compiti`} className="cv-link text-sm">
              Tutti i compiti →
            </Link>
          </p>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Ultime spese</h2>
        {recentExpenses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessuna spesa registrata.</p>
        ) : (
          <ul className="cv-card-solid mt-3 divide-y divide-slate-100 p-0">
            {recentExpenses.map((e) => (
              <li key={e.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold text-slate-900">{e.title}</span>
                  <span className="ml-2 text-slate-500">· {e.paidBy.name}</span>
                </span>
                <span className="tabular-nums font-medium text-slate-800">{formatEuroFromCents(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
