import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpenseNotesBody } from "@/components/ExpenseNotesBody";
import { AddMoneyTransferForm } from "@/components/AddMoneyTransferForm";
import { ExpenseEditForm, type EditableExpense } from "@/components/ExpenseEditForm";
import { SettlementPlanPanel } from "@/components/SettlementPlanPanel";
import { auth } from "@/auth";
import { computeMemberBalances } from "@/lib/balances";
import { computeMinimalSettlementPlan } from "@/lib/settlement-plan";
import { deleteExpense } from "@/lib/actions/expenses";
import { deleteMoneyTransfer } from "@/lib/actions/transfers";
import { formatEuroFromCents } from "@/lib/money";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { createTranslator } from "@/lib/i18n/server";
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

  const { t, locale } = await createTranslator();
  const intlTag = intlLocaleTag(locale);

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
    return formatMessage(t("expensesPage.splitEqual"), { n: e.splits.length });
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="flex min-h-[22rem] flex-col lg:min-h-[28rem]">
          <AddExpenseForm houseId={houseId} members={members} />
        </div>
        <div className="flex min-h-0 flex-col gap-6">
          <div className="cv-card-solid flex flex-1 flex-col p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">{t("expensesPage.balancesTitle")}</h2>
            <p className="mt-1 text-xs text-slate-500">{t("expensesPage.balancesTransfersHint")}</p>
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
            <h2 className="text-sm font-bold text-slate-900">{t("expensesPage.settleHowTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{t("expensesPage.settleHowBody")}</p>
            <p className="mt-2 text-[11px] text-slate-500">{t("expensesPage.settleHowHint")}</p>
            <div className="mt-4">
              <SettlementPlanPanel steps={settlementSteps} />
            </div>
          </div>
          <div className="cv-card-solid p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">{t("expensesPage.transferSectionTitle")}</h2>
            <p className="mt-1 text-xs text-slate-500">{t("expensesPage.transferSectionHint")}</p>
            <div className="mt-4">
              <AddMoneyTransferForm houseId={houseId} members={members} />
            </div>
          </div>
        </div>
      </div>

      {transfers.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-slate-900">{t("expensesPage.recentTransfersTitle")}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {transfers.map((tr) => (
              <li key={tr.id} className="cv-card-solid flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {tr.fromUser.name} → {tr.toUser.name}
                  </p>
                  <p className="tabular-nums text-slate-800">{formatEuroFromCents(tr.amountCents)}</p>
                  {tr.note ? <p className="text-xs text-slate-500">{tr.note}</p> : null}
                  <p className="text-xs text-slate-400">{new Date(tr.transferDate).toLocaleString(intlTag)}</p>
                </div>
                <form action={removeTransferAction}>
                  <input type="hidden" name="transferId" value={tr.id} />
                  <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">
                    {t("expensesPage.transferDelete")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold text-slate-900">{t("expensesPage.expenseHistoryTitle")}</h2>
        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("expensesPage.expenseHistoryEmpty")}</p>
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
                      <ExpenseNotesBody notes={e.notes} />
                    </div>
                    <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                      {formatEuroFromCents(e.amountCents)}
                    </p>
                  </div>
                  <dl className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500">{t("expensesPage.labelDate")}</dt>
                      <dd>{new Date(e.expenseDate).toLocaleDateString(intlTag)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("expensesPage.labelPaidBy")}</dt>
                      <dd>{e.paidBy.name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-500">{t("expensesPage.labelSplit")}</dt>
                      <dd className="mt-0.5 break-words">{splitLabel(e)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("expensesPage.labelReceipt")}</dt>
                      <dd>
                        {e.receiptUrl ? (
                          <a
                            href={e.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-700 hover:text-emerald-900"
                          >
                            {t("expensesPage.receiptOpen")}
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
                        {t("expensesPage.delete")}
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
