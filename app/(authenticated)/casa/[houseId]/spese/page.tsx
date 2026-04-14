import { AddExpenseForm } from "@/components/AddExpenseForm";
import { AddMoneyTransferForm } from "@/components/AddMoneyTransferForm";
import { ExpenseEditForm, type EditableExpense } from "@/components/ExpenseEditForm";
import { SettlementPlanPanel } from "@/components/SettlementPlanPanel";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { computeMinimalSettlementPlan } from "@/lib/settlement-plan";
import { deleteExpense } from "@/lib/actions/expenses";
import { deleteMoneyTransfer } from "@/lib/actions/transfers";
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

  const [expenses, balances, transfers] = await Promise.all([
    prisma.expense.findMany({
      where: { houseId },
      orderBy: { expenseDate: "desc" },
      include: {
        paidBy: { select: { name: true } },
        splits: {
          orderBy: { shareCents: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    }),
    computeMemberBalances(houseId),
    prisma.moneyTransfer.findMany({
      where: { houseId },
      orderBy: { transferDate: "desc" },
      take: 40,
      include: {
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
    }),
  ]);

  async function removeExpenseAction(formData: FormData) {
    "use server";
    const id = formData.get("expenseId") as string;
    await deleteExpense(houseId, id);
  }

  async function removeTransferAction(formData: FormData) {
    "use server";
    const id = formData.get("transferId") as string;
    await deleteMoneyTransfer(houseId, id);
  }

  const settlementSteps = computeMinimalSettlementPlan(balances);

  function splitLabel(e: (typeof expenses)[0]): string {
    if (e.splitMode === "PERCENT") {
      return e.splits.map((s) => `${s.user.name} (${s.sharePercent ?? 0}%): ${formatEuroFromCents(s.shareCents)}`).join(" · ");
    }
    if (e.splitMode === "CUSTOM") {
      return e.splits.map((s) => `${s.user.name}: ${formatEuroFromCents(s.shareCents)}`).join(" · ");
    }
    return `Uguale · ${e.splits.length} partecipanti`;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="flex min-h-[22rem] flex-col lg:min-h-[28rem]">
          <AddExpenseForm houseId={houseId} members={members} />
        </div>
        <div className="flex min-h-0 flex-col gap-6">
          <div className="cv-card-solid flex flex-1 flex-col p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">Saldi per membro</h2>
            <p className="mt-1 text-xs text-slate-500">
              I trasferimenti registrati aggiornano il saldo (non sono spese condivise).
            </p>
            <ul className="mt-3 flex-1 space-y-2 overflow-auto text-sm">
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
          <div className="cv-card-solid border-emerald-200/50 bg-gradient-to-b from-emerald-50/35 to-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">Come pareggiare (proposta)</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              In base ai saldi attuali, questa è una sequenza con il{" "}
              <strong className="font-semibold text-slate-800">minor numero possibile di trasferimenti</strong> per
              riportare tutti verso zero: con <em>n</em> persone con saldo non nullo bastano al massimo <em>n</em> − 1
              movimenti.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Saldo positivo = ha pagato più della propria quota e va ricevuto; negativo = deve ancora contribuire. Ogni
              riga indica da chi a chi inviare denaro.
            </p>
            <div className="mt-4">
              <SettlementPlanPanel steps={settlementSteps} />
            </div>
          </div>
          <div className="cv-card-solid p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">Trasferimento tra coinquilini</h2>
            <p className="mt-1 text-xs text-slate-500">
              Registra un bonifico o un contante da una persona all&apos;altra per pareggiare, senza creare una spesa
              condivisa.
            </p>
            <div className="mt-4">
              <AddMoneyTransferForm houseId={houseId} members={members} />
            </div>
          </div>
        </div>
      </div>

      {transfers.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-slate-900">Trasferimenti recenti</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {transfers.map((t) => (
              <li key={t.id} className="cv-card-solid flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {t.fromUser.name} → {t.toUser.name}
                  </p>
                  <p className="tabular-nums text-slate-800">{formatEuroFromCents(t.amountCents)}</p>
                  {t.note ? <p className="text-xs text-slate-500">{t.note}</p> : null}
                  <p className="text-xs text-slate-400">{new Date(t.transferDate).toLocaleString("it-IT")}</p>
                </div>
                <form action={removeTransferAction}>
                  <input type="hidden" name="transferId" value={t.id} />
                  <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">
                    Elimina
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold text-slate-900">Storico spese</h2>
        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessuna spesa ancora.</p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {expenses.map((e) => {
              const editable: EditableExpense = {
                id: e.id,
                title: e.title,
                amountCents: e.amountCents,
                paidById: e.paidById,
                notes: e.notes,
                splitMode: e.splitMode,
                receiptUrl: e.receiptUrl,
                splits: e.splits.map((s) => ({
                  userId: s.userId,
                  shareCents: s.shareCents,
                  sharePercent: s.sharePercent,
                })),
              };
              return (
                <li key={e.id} className="cv-card-solid flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{e.title}</p>
                      {e.notes ? <p className="mt-1 text-sm text-slate-600">{e.notes}</p> : null}
                    </div>
                    <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                      {formatEuroFromCents(e.amountCents)}
                    </p>
                  </div>
                  <dl className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500">Data</dt>
                      <dd>{new Date(e.expenseDate).toLocaleDateString("it-IT")}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Pagato da</dt>
                      <dd>{e.paidBy.name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-500">Ripartizione</dt>
                      <dd className="mt-0.5 break-words">{splitLabel(e)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Scontrino</dt>
                      <dd>
                        {e.receiptUrl ? (
                          <a
                            href={e.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-700 hover:text-emerald-900"
                          >
                            Apri
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                    <ExpenseEditForm houseId={houseId} members={members} expense={editable} />
                    <form action={removeExpenseAction}>
                      <input type="hidden" name="expenseId" value={e.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">
                        Elimina
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
