import { AddHouseChoreForm } from "@/components/AddHouseChoreForm";
import { AddTaskForm } from "@/components/AddTaskForm";
import { HouseChoreCard, type HouseChoreCardData } from "@/components/HouseChoreCard";
import { auth } from "@/auth";
import { utcCalendarDateKey } from "@/lib/calendar-all-day";
import { deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { previewUpcomingAssignments } from "@/lib/house-chore-utils";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { createTranslator } from "@/lib/i18n/server";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";

export default async function CompitiPage({
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

  const [tasks, houseChores] = await Promise.all([
    prisma.task.findMany({
      where: { houseId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { name: true } },
        createdBy: { select: { name: true } },
        linkedCalendarEvent: { select: { id: true, cancelledAt: true } },
      },
    }),
    prisma.houseChore.findMany({
      where: { houseId },
      orderBy: { createdAt: "desc" },
      include: {
        members: { orderBy: { sortOrder: "asc" }, include: { user: { select: { name: true } } } },
        swaps: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  const openTasks = tasks.filter((x) => x.status !== "DONE");
  const doneTasks = tasks.filter((x) => x.status === "DONE");

  const choreCards: HouseChoreCardData[] = houseChores.map((c) => {
    const membersOrdered = c.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      sortOrder: m.sortOrder,
    }));
    const swapsByKey = new Map(c.swaps.map((s) => [utcCalendarDateKey(s.occurrenceDate), s.assigneeUserId]));
    const preview = previewUpcomingAssignments(
      c.anchorDate,
      c.everyDays,
      c.recurrenceEndDate,
      membersOrdered,
      swapsByKey,
      8,
    );
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      everyDays: c.everyDays,
      syncCalendar: c.syncCalendar,
      recurrenceEndDateKey: utcCalendarDateKey(c.recurrenceEndDate),
      createdByName: c.createdBy.name,
      members: membersOrdered,
      preview,
    };
  });

  async function toggleTaskAction(formData: FormData) {
    "use server";
    const id = formData.get("taskId") as string;
    const next = formData.get("nextStatus") as string;
    await setTaskStatus(houseId, id, next === "DONE" ? "DONE" : "TODO");
  }

  async function removeTaskAction(formData: FormData) {
    "use server";
    const id = formData.get("taskId") as string;
    await deleteTask(houseId, id);
  }

  function taskMetaLine(task: (typeof tasks)[0]): string {
    const parts: string[] = [];
    if (task.assignee) parts.push(task.assignee.name);
    else parts.push(t("tasksPage.unassigned"));
    if (task.dueDate) {
      parts.push(
        new Date(task.dueDate).toLocaleString(intlTag, {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
    if (task.linkedCalendarEvent && !task.linkedCalendarEvent.cancelledAt) {
      parts.push(t("tasksPage.calendarBadgeShort"));
    }
    return parts.join(" · ");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-12">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("tasksPage.pageTitle")}</h1>
        <p className="text-sm leading-relaxed text-slate-600">{t("tasksPage.pageLead")}</p>
      </header>

      {/* Compiti */}
      <section className="space-y-4" aria-labelledby="compiti-todo">
        <h2 id="compiti-todo" className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {t("tasksPage.sectionTodo")}
        </h2>

        <details className="group rounded-2xl border border-emerald-200/60 bg-emerald-50/20 open:bg-emerald-50/35">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-emerald-900 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>{t("tasksPage.toggleAddTask")}</span>
              <span className="text-lg font-light text-emerald-600/80 transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <div className="border-t border-emerald-200/40 px-3 pb-4 pt-1 sm:px-4">
            <AddTaskForm houseId={houseId} members={members} embedded />
          </div>
        </details>

        {openTasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            {t("tasksPage.emptyOpen")}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            {openTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  {task.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{task.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">{taskMetaLine(task)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch sm:gap-1.5">
                  <form action={toggleTaskAction} className="contents sm:block">
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="nextStatus" value="DONE" />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-full sm:py-2"
                    >
                      {t("tasksPage.markDoneShort")}
                    </button>
                  </form>
                  <form action={removeTaskAction} className="contents sm:block">
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-red-700 sm:w-full"
                    >
                      {t("tasksPage.deleteShort")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {doneTasks.length > 0 ? (
          <details className="rounded-xl border border-slate-200/80 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
              {formatMessage(t("tasksPage.doneCount"), { n: String(doneTasks.length) })}
            </summary>
            <ul className="divide-y divide-slate-200/80 border-t border-slate-200/80">
              {doneTasks.map((task) => (
                <li key={task.id} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-400 line-through">{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{taskMetaLine(task)}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={toggleTaskAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="nextStatus" value="TODO" />
                      <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                        {t("tasksPage.markTodoShort")}
                      </button>
                    </form>
                    <form action={removeTaskAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" className="text-xs font-medium text-slate-400 hover:text-red-600">
                        {t("tasksPage.deleteShort")}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Faccende */}
      <section className="space-y-4 border-t border-slate-200/80 pt-10" aria-labelledby="compiti-chores">
        <div>
          <h2 id="compiti-chores" className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {t("houseChores.sectionTitleShort")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t("houseChores.sectionLeadShort")}</p>
        </div>

        {choreCards.length === 0 ? (
          <p className="text-sm text-slate-500">{t("houseChores.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {choreCards.map((c) => (
              <HouseChoreCard key={c.id} houseId={houseId} chore={c} />
            ))}
          </ul>
        )}

        <details className="group rounded-2xl border border-slate-200/90 bg-slate-50/30 open:bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>{t("houseChores.toggleAddChore")}</span>
              <span className="text-lg font-light text-slate-400 transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <div className="border-t border-slate-200/80 px-3 pb-4 pt-2 sm:px-4">
            <AddHouseChoreForm houseId={houseId} members={members} embedded />
          </div>
        </details>
      </section>
    </div>
  );
}
