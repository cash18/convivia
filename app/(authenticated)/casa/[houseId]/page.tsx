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
        <h2 className="text-lg font-semibold text-zinc-900">Saldi indicativi</h2>
        <p className="text-xs text-zinc-500">
          Positivo = hai pagato più della tua quota; negativo = devi ancora &quot;rimetterti in pari&quot; rispetto a
          quanto hai consumato.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {balances.map((b) => (
            <li
              key={b.userId}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm"
            >
              <span className="font-medium text-zinc-800">{b.name}</span>
              <span className={b.balanceCents >= 0 ? "text-emerald-800" : "text-amber-800"}>
                {formatEuroFromCents(b.balanceCents)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          <Link href={`/casa/${houseId}/spese`} className="text-sm font-medium text-emerald-800 underline">
            Vai alle spese →
          </Link>
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Prossimi eventi</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nessun evento futuro.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-zinc-900">{ev.title}</span>
                  <p className="text-xs text-zinc-500">
                    {ev.allDay
                      ? new Date(ev.startsAt).toLocaleDateString("it-IT")
                      : new Date(ev.startsAt).toLocaleString("it-IT")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2">
            <Link href={`/casa/${houseId}/calendario`} className="text-sm font-medium text-emerald-800 underline">
              Calendario completo →
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Compiti aperti</h2>
          {openTasks.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nessun compito in sospeso.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-zinc-900">{t.title}</span>
                  <p className="text-xs text-zinc-500">
                    {t.assignee ? `Assegnato a ${t.assignee.name}` : "Non assegnato"}
                    {t.dueDate ? ` · scadenza ${new Date(t.dueDate).toLocaleString("it-IT")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2">
            <Link href={`/casa/${houseId}/compiti`} className="text-sm font-medium text-emerald-800 underline">
              Tutti i compiti →
            </Link>
          </p>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Ultime spese</h2>
        {recentExpenses.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Nessuna spesa registrata.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {recentExpenses.map((e) => (
              <li key={e.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  <span className="font-medium text-zinc-900">{e.title}</span>
                  <span className="ml-2 text-zinc-500">· {e.paidBy.name}</span>
                </span>
                <span className="tabular-nums text-zinc-800">{formatEuroFromCents(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
