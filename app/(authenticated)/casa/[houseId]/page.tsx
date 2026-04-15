import { AddExpenseForm } from "@/components/AddExpenseForm";
import { SettlementPlanPanel } from "@/components/SettlementPlanPanel";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { createTranslator } from "@/lib/i18n/server";
import { expandOccurrencesInRange } from "@/lib/calendar-recurrence";
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

  const userId = session.user.id;
  const { t, locale } = await createTranslator();
  const intlTag = intlLocaleTag(locale);

  const membership = await getMembershipOrRedirect(houseId, userId);
  const members = membership.house.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));

  const [
    balances,
    calendarRows,
    myOpenTasks,
    otherOpenTasks,
    recentExpenses,
    myRecentPaidExpenses,
    listsPreview,
    listUndoneCounts,
  ] = await Promise.all([
    computeMemberBalances(houseId),
    prisma.calendarEvent.findMany({
      where: { houseId, cancelledAt: null },
      orderBy: { startsAt: "asc" },
      take: 48,
    }),
    prisma.task.findMany({
      where: { houseId, status: "TODO", assigneeId: userId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 8,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: {
        houseId,
        status: "TODO",
        OR: [{ assigneeId: null }, { assigneeId: { not: userId } }],
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 10,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { houseId },
      orderBy: { expenseDate: "desc" },
      take: 6,
      include: { paidBy: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { houseId, paidById: userId },
      orderBy: { expenseDate: "desc" },
      take: 6,
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

  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 86400000);
  type UpcomingRow = { key: string; title: string; allDay: boolean; startsAt: Date };
  const upcomingRows: UpcomingRow[] = [];
  for (const ev of calendarRows) {
    const occs = expandOccurrencesInRange(
      ev.startsAt,
      ev.endsAt,
      ev.allDay,
      ev.recurrenceRule,
      now,
      horizon,
    );
    for (const o of occs) {
      if (o.startsAt.getTime() >= now.getTime()) {
        upcomingRows.push({
          key: `${ev.id}_${o.startsAt.getTime()}`,
          title: ev.title,
          allDay: ev.allDay,
          startsAt: o.startsAt,
        });
      }
    }
  }
  upcomingRows.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const upcomingPreview = upcomingRows.slice(0, 6);

  const balancesSorted = [...balances].sort((a, b) => {
    if (a.userId === userId) return -1;
    if (b.userId === userId) return 1;
    return 0;
  });

  const undoneByListId = new Map(listUndoneCounts.map((r) => [r.listId, r._count._all]));
  const settlementSteps = computeMinimalSettlementPlan(balances);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="cv-badge w-fit">{t("casaHome.badge")}</p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{t("casaHome.intro")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-stretch">
        <section className="cv-card-solid flex flex-col border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 p-5 shadow-[0_8px_40px_-16px_rgba(5,150,105,0.2)] sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">{t("casaHome.forYouTitle")}</h2>
            <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-500/25">
              {t("casaHome.youBadge")}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{t("casaHome.forYouHint")}</p>

          <div className="mt-5 grid flex-1 gap-6 sm:grid-cols-2 sm:gap-5">
            <div className="flex min-h-0 flex-col rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-900">{t("casaHome.yourTasksTitle")}</h3>
              {myOpenTasks.length === 0 ? (
                <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.yourTasksEmpty")}</p>
              ) : (
                <ul className="mt-2 flex flex-1 flex-col gap-2 overflow-auto">
                  {myOpenTasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-emerald-100/90 bg-emerald-50/50 px-3 py-2.5 text-sm shadow-sm"
                    >
                      <span className="font-semibold text-slate-900">{task.title}</span>
                      <p className="text-xs text-emerald-900/80">
                        {task.dueDate ? new Date(task.dueDate).toLocaleString(intlTag) : t("casaHome.noDue")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 shrink-0">
                <Link href={`/casa/${houseId}/compiti`} className="cv-link text-sm font-medium">
                  {t("casaHome.yourTasksLink")}
                </Link>
              </p>
            </div>

            <div className="flex min-h-0 flex-col rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-900">{t("casaHome.yourExpensesTitle")}</h3>
              {myRecentPaidExpenses.length === 0 ? (
                <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.yourExpensesEmpty")}</p>
              ) : (
                <ul className="mt-2 flex flex-1 flex-col divide-y divide-emerald-100/80 overflow-auto rounded-xl border border-emerald-100/60 bg-white/90">
                  {myRecentPaidExpenses.map((e) => (
                    <li key={e.id} className="flex justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="font-semibold text-slate-900">{e.title}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {new Date(e.expenseDate).toLocaleDateString(intlTag)}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold text-emerald-800">
                        {formatEuroFromCents(e.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 shrink-0">
                <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm font-medium">
                  {t("casaHome.yourExpensesLink")}
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="cv-card-solid flex min-h-0 flex-col p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">{t("casaHome.balancesTitle")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("casaHome.balancesHint")}</p>
          <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto text-sm">
            {balancesSorted.map((b) => {
              const mine = b.userId === userId;
              return (
                <li
                  key={b.userId}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                    mine
                      ? "border-2 border-emerald-400/70 bg-gradient-to-r from-emerald-50 to-teal-50/80 shadow-sm ring-1 ring-emerald-500/15"
                      : "border border-slate-100 bg-white/80"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    {b.name}
                    {mine ? (
                      <span className="rounded bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                        {t("casaHome.youBadge")}
                      </span>
                    ) : null}
                  </span>
                  <span className={b.balanceCents >= 0 ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                    {formatEuroFromCents(b.balanceCents)}
                  </span>
                </li>
              );
            })}
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

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="flex min-h-[18rem] flex-col">
          <AddExpenseForm houseId={houseId} members={members} variant="compact" />
        </section>
        <section className="cv-card-solid flex min-h-[18rem] flex-col p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900">{t("casaHome.recentHouseTitle")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("casaHome.recentHouseHint")}</p>
          <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{t("casaHome.recentExpensesSubtitle")}</h3>
          {recentExpenses.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.noExpenses")}</p>
          ) : (
            <ul className="mt-2 flex flex-1 flex-col divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-100 bg-white/90">
              {recentExpenses.map((e) => {
                const paidByYou = e.paidById === userId;
                return (
                  <li
                    key={e.id}
                    className={`flex justify-between gap-2 px-3 py-2.5 text-sm ${paidByYou ? "bg-emerald-50/40" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-slate-900">{e.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                        <span>{e.paidBy.name}</span>
                        {paidByYou ? (
                          <span className="rounded bg-emerald-600/15 px-1 py-0.5 text-[10px] font-semibold uppercase text-emerald-900">
                            {t("casaHome.youBadge")}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums font-medium text-slate-800">
                      {formatEuroFromCents(e.amountCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 shrink-0">
            <Link href={`/casa/${houseId}/spese`} className="cv-link text-sm">
              {t("casaHome.linkFullHistory")}
            </Link>
          </p>
        </section>
      </div>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{t("casaHome.upcoming")}</h2>
          {upcomingPreview.length === 0 ? (
            <p className="mt-2 flex-1 text-sm text-slate-500">{t("casaHome.noUpcoming")}</p>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-auto">
              {upcomingPreview.map((ev) => (
                <li key={ev.key} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">{ev.title}</span>
                  <p className="text-xs text-slate-500">
                    {ev.allDay
                      ? ev.startsAt.toLocaleDateString(intlTag)
                      : ev.startsAt.toLocaleString(intlTag)}
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
        <p className="mt-1 text-xs text-slate-500">{t("casaHome.tasksSubtitle")}</p>
        {otherOpenTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("casaHome.noTasks")}</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {otherOpenTasks.map((task) => (
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
