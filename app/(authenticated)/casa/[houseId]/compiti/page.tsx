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

  const choreCards: HouseChoreCardData[] = houseChores.map((c) => {
    const membersOrdered = c.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      sortOrder: m.sortOrder,
    }));
    const swapsByKey = new Map(c.swaps.map((s) => [utcCalendarDateKey(s.occurrenceDate), s.assigneeUserId]));
    const preview = previewUpcomingAssignments(c.anchorDate, c.everyDays, membersOrdered, swapsByKey, 8);
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      everyDays: c.everyDays,
      syncCalendar: c.syncCalendar,
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

  return (
    <div className="space-y-8">
      <AddTaskForm houseId={houseId} members={members} />

      <section>
        <h2 className="text-lg font-bold text-slate-900">{t("tasksPage.listTitle")}</h2>
        {tasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("tasksPage.empty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="cv-card-solid flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <p
                    className={`font-bold ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"}`}
                  >
                    {task.title}
                  </p>
                  {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {task.assignee
                      ? formatMessage(t("tasksPage.assignee"), { name: task.assignee.name })
                      : t("tasksPage.unassigned")}
                    {task.dueDate
                      ? ` · ${formatMessage(t("tasksPage.due"), { date: new Date(task.dueDate).toLocaleString(intlTag) })}`
                      : ""}
                    <span className="text-slate-400">
                      {" "}
                      {formatMessage(t("tasksPage.createdBy"), { name: task.createdBy.name })}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={toggleTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="nextStatus" value={task.status === "DONE" ? "TODO" : "DONE"} />
                    <button type="submit" className="cv-pill-nav text-sm">
                      {task.status === "DONE" ? t("tasksPage.markTodo") : t("tasksPage.markDone")}
                    </button>
                  </form>
                  <form action={removeTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                      {t("tasksPage.delete")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-200/80 pt-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t("houseChores.sectionTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{t("houseChores.sectionIntro")}</p>
        </div>

        {choreCards.length === 0 ? (
          <p className="text-sm text-slate-500">{t("houseChores.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {choreCards.map((c) => (
              <HouseChoreCard key={c.id} houseId={houseId} chore={c} />
            ))}
          </ul>
        )}

        <AddHouseChoreForm houseId={houseId} members={members} />
      </section>
    </div>
  );
}
