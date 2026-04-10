import { AddTaskForm } from "@/components/AddTaskForm";
import { auth } from "@/auth";
import { deleteTask, setTaskStatus } from "@/lib/actions/tasks";
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

  const membership = await getMembershipOrRedirect(houseId, session.user.id);
  const members = membership.house.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));

  const tasks = await prisma.task.findMany({
    where: { houseId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
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
        <h2 className="text-lg font-bold text-slate-900">Elenco compiti</h2>
        {tasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessun compito. Aggiungine uno per organizzare i turni.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="cv-card-solid flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <p
                    className={`font-bold ${t.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"}`}
                  >
                    {t.title}
                  </p>
                  {t.description ? <p className="mt-1 text-sm text-slate-600">{t.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {t.assignee ? `Assegnato a ${t.assignee.name}` : "Non assegnato"}
                    {t.dueDate ? ` · scadenza ${new Date(t.dueDate).toLocaleString("it-IT")}` : ""}
                    <span className="text-slate-400"> · creato da {t.createdBy.name}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={toggleTaskAction}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="nextStatus" value={t.status === "DONE" ? "TODO" : "DONE"} />
                    <button type="submit" className="cv-pill-nav text-sm">
                      {t.status === "DONE" ? "Segna da fare" : "Segna fatto"}
                    </button>
                  </form>
                  <form action={removeTaskAction}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                      Elimina
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
