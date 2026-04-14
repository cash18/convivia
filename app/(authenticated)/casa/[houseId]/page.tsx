import { AddExpenseForm } from "@/components/AddExpenseForm";
import { SettlementPlanPanel } from "@/components/SettlementPlanPanel";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { computeMinimalSettlementPlan } from "@/lib/settlement-plan";
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

  const membership = await getMembershipOrRedirect(houseId, session.user.id);
  const members = membership.house.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));

  const [balances, upcoming, openTasks, recentExpenses, listsPreview, listUndoneCounts] = await Promise.all([
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
    prisma.shoppingList.findMany({
      where: { houseId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        _count: { select: { items: true } },
        items: {
          where: { done: false },
          orderBy: { createdAt: "asc" },
          take: 4,
          select: { id: true, name: true },
        },
      },
    }),
    prisma.shoppingListItem.groupBy({
      by: ["listId"],
      where: { done: false, list: { houseId } },
      _count: { _all: true },
    }),
  ]);

  const undoneByListId = new Map(listUndoneCounts.map((r) => [r.listId, r._count._all]));
  const settlementSteps = computeMinimalSettlementPlan(balances);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="cv-badge w-fit">Home della casa</p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Riepilogo di <strong className="font-semibold text-slate-800">spese</strong>,{" "}
          <strong className="font-semibold text-slate-800">saldi</strong>,{" "}
          <strong className="font-semibold text-slate-800">calendario</strong>,{" "}
          <strong className="font-semibold text-slate-800">liste</strong> e{" "}
          <strong className="font-semibold text-slate-800">compiti</strong>. Usa il menu in alto per le sezioni
          complete.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="flex min-h-[20rem] flex-col">
          <AddExpenseForm houseId={houseId} members={members} variant="compact" />
        </section>
        <section className="cv-card-solid flex min-h-[20rem] flex-col p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">Saldi indicativi</h2>
          <p className="mt-1 text-xs text-slate-500">
            Positivo = hai pagato più della tua quota; negativo = devi ancora rimetterti in pari.
          </p>
          <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto text-sm">
            {balances.map((b) => (
              <li key={b.userId} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/80 px-3 py-2.5">
                <span className="font-semibold text-slate-800">{b.name}</span>
                <span className={b.balanceCents >= 0 ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                  {formatEuroFromCents(b.balanceCents)}
                </span>
              </li>
            ))}
          </ul>
          {settlementSteps.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-800">Piano di pareggio (proposta)</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Meno trasferimenti possibili tra coinquilini; dettaglio e registrazione in Spese.
              </p>
              <div className="mt-3">
                <SettlementPlanPanel steps={settlementSteps} compact />
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-slate-100 pt-4 text-[11px] font-medium text-emerald-800">
              Saldi in equilibrio: nessun trasferimento necessario.
            </p>
          )}
          <p className="mt-4 shrink-0">
            <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm">
              Spese e trasferimenti →
            </Link>
          </p>
        </section>
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Ultime spese</h2>
          {recentExpenses.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">Nessuna spesa registrata.</p>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-100 bg-white/90">
              {recentExpenses.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold text-slate-900">{e.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{e.paidBy.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-slate-800">
                    {formatEuroFromCents(e.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 shrink-0">
            <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm">
              Storico completo →
            </Link>
          </p>
        </section>

        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Prossimi eventi</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">Nessun evento futuro.</p>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto">
              {upcoming.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
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
          <p className="mt-3 shrink-0">
            <Link href={`/casa/${houseId}/calendario`} className="cv-link text-sm">
              Calendario →
            </Link>
          </p>
        </section>

        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">Liste spesa</h2>
          {listsPreview.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">Nessuna lista.</p>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto">
              {listsPreview.map((list) => {
                const pendingCount = undoneByListId.get(list.id) ?? 0;
                const total = list._count.items;
                return (
                  <li key={list.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
                    <p className="font-semibold text-slate-900">{list.name}</p>
                    <p className="text-xs text-slate-500">
                      {total === 0
                        ? "Lista vuota"
                        : pendingCount === 0
                          ? "Tutto spuntato ✓"
                          : `${pendingCount} da comprare · ${total} voci`}
                    </p>
                    {list.items.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 border-t border-slate-100/80 pt-2 text-xs text-slate-600">
                        {list.items.map((it) => (
                          <li key={it.id} className="truncate">
                            · {it.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 shrink-0">
            <Link href={`/casa/${houseId}/liste`} className="cv-link text-sm">
              Gestisci liste →
            </Link>
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Compiti aperti</h2>
        {openTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessun compito in sospeso.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {openTasks.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
                <span className="font-semibold text-slate-900">{t.title}</span>
                <p className="text-xs text-slate-500">
                  {t.assignee ? `Assegnato a ${t.assignee.name}` : "Non assegnato"}
                  {t.dueDate ? ` · ${new Date(t.dueDate).toLocaleString("it-IT")}` : ""}
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
  );
}
