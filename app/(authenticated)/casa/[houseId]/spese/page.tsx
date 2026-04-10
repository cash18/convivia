import { AddExpenseForm } from "@/components/AddExpenseForm";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatEuroFromCents } from "@/lib/money";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";

export default async function SpesePage({
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

  const [expenses, balances] = await Promise.all([
    prisma.expense.findMany({
      where: { houseId },
      orderBy: { expenseDate: "desc" },
      include: { paidBy: { select: { name: true } } },
    }),
    computeMemberBalances(houseId),
  ]);

  async function removeExpenseAction(formData: FormData) {
    "use server";
    const id = formData.get("expenseId") as string;
    await deleteExpense(houseId, id);
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <AddExpenseForm houseId={houseId} members={members} />
        <div className="cv-card-solid p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">Saldi per membro</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {balances.map((b) => (
              <li
                key={b.userId}
                className="flex justify-between border-b border-slate-200/70 py-2 last:border-0"
              >
                <span className="font-medium text-slate-700">{b.name}</span>
                <span className={b.balanceCents >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                  {formatEuroFromCents(b.balanceCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Storico spese</h2>
        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessuna spesa ancora.</p>
        ) : (
          <div className="cv-card-solid mt-4 overflow-x-auto p-0">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/90 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrizione</th>
                  <th className="px-4 py-3 font-medium">Pagato da</th>
                  <th className="px-4 py-3 font-medium text-right">Importo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="bg-white/50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(e.expenseDate).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{e.title}</span>
                      {e.notes ? <p className="text-xs text-slate-500">{e.notes}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{e.paidBy.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {formatEuroFromCents(e.amountCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeExpenseAction}>
                        <input type="hidden" name="expenseId" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                          title="Elimina spesa"
                        >
                          Elimina
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
