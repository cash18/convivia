import { AddExpenseForm } from "@/components/AddExpenseForm";
import { SettlementPlanPanel } from "@/components/SettlementPlanPanel";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { createTranslator } from "@/lib/i18n/server";
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

  const { t, locale } = await createTranslator();
  const intlTag = intlLocaleTag(locale);

  const membership = await getMembershipOrRedirect(houseId, session.user.id);
  const members = membership.house.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));

  const [balances, upcoming, openTasks, recentExpenses, listsPreview, listUndoneCounts] = await Promise.all([
    computeMemberBalances(houseId),
    prisma.calendarEvent.findMany({
      where: { houseId, cancelledAt: null, startsAt: { gte: new Date() } },
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
      where: { houseId, completedAt: null },
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
      where: { done: false, list: { houseId, completedAt: null } },
      _count: { _all: true },
    }),
  ]);

  const undoneByListId = new Map(listUndoneCounts.map((r) => [r.listId, r._count._all]));
  const settlementSteps = computeMinimalSettlementPlan(balances);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="cv-badge w-fit">{t("casaHome.badge")}</p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{t("casaHome.intro")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="flex min-h-[20rem] flex-col">
          <AddExpenseForm houseId={houseId} members={members} variant="compact" />
        </section>
        <section className="cv-card-solid flex min-h-[20rem] flex-col p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">{t("casaHome.balancesTitle")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("casaHome.balancesHint")}</p>
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
              <p className="text-xs font-bold text-slate-800">{t("casaHome.settlementTitle")}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{t("casaHome.settlementHint")}</p>
              <div className="mt-3">
                <SettlementPlanPanel steps={settlementSteps} compact />
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-slate-100 pt-4 text-[11px] font-medium text-emerald-800">
              {t("casaHome.balanced")}
            </p>
          )}
          <p className="mt-4 shrink-0">
            <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm">
              {t("casaHome.linkExpenses")}
            </Link>
          </p>
        </section>
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{t("casaHome.recentExpenses")}</h2>
          {recentExpenses.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.noExpenses")}</p>
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
              {t("casaHome.linkFullHistory")}
            </Link>
          </p>
        </section>

        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{t("casaHome.upcoming")}</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.noUpcoming")}</p>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto">
              {upcoming.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">{ev.title}</span>
                  <p className="text-xs text-slate-500">
                    {ev.allDay
                      ? new Date(ev.startsAt).toLocaleDateString(intlTag)
                      : new Date(ev.startsAt).toLocaleString(intlTag)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 shrink-0">
            <Link href={`/casa/${houseId}/calendario`} className="cv-link text-sm">
              {t("casaHome.linkCalendar")}
            </Link>
          </p>
        </section>

        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">{t("casaHome.listsTitle")}</h2>
          {listsPreview.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.noLists")}</p>
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
                        ? t("casaHome.listEmpty")
                        : pendingCount === 0
                          ? t("casaHome.listAllDone")
                          : formatMessage(t("casaHome.listPending"), { pending: pendingCount, total })}
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
              {t("casaHome.linkLists")}
            </Link>
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">{t("casaHome.tasksTitle")}</h2>
        {openTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("casaHome.noTasks")}</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {openTasks.map((task) => (
              <li key={task.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
                <span className="font-semibold text-slate-900">{task.title}</span>
                <p className="text-xs text-slate-500">
                  {task.assignee
                    ? formatMessage(t("casaHome.assignee"), { name: task.assignee.name })
                    : t("casaHome.unassigned")}
                  {task.dueDate ? ` · ${new Date(task.dueDate).toLocaleString(intlTag)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3">
          <Link href={`/casa/${houseId}/compiti`} className="cv-link text-sm">
            {t("casaHome.linkTasks")}
          </Link>
        </p>
      </section>
    </div>
  );
}
