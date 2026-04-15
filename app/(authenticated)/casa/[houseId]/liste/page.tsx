import { NewShoppingListForm } from "@/components/NewShoppingListForm";
import { ShoppingListCard } from "@/components/ShoppingListCard";
import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n/server";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";

export default async function ListePage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const { t } = await createTranslator();

  const membership = await getMembershipOrRedirect(houseId, session.user.id);
  const members = membership.house.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));

  const [activeLists, completedLists] = await Promise.all([
    prisma.shoppingList.findMany({
      where: { houseId, completedAt: null },
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.shoppingList.findMany({
      where: { houseId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 40,
      include: { items: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-2">
      <div className="cv-card-solid p-5 sm:p-6">
        <NewShoppingListForm houseId={houseId} />
      </div>

      {activeLists.length === 0 && completedLists.length === 0 ? (
        <p className="text-sm font-medium text-slate-500">{t("listsPage.empty")}</p>
      ) : activeLists.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {activeLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              houseId={houseId}
              listId={list.id}
              name={list.name}
              members={members}
              completedAt={list.completedAt?.toISOString() ?? null}
              items={list.items.map((i) => ({ id: i.id, name: i.name, done: i.done }))}
            />
          ))}
        </div>
      ) : null}

      {completedLists.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">{t("listsPage.completedSectionTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedLists.map((list) => (
              <ShoppingListCard
                key={list.id}
                houseId={houseId}
                listId={list.id}
                name={list.name}
                members={members}
                completedAt={list.completedAt?.toISOString() ?? null}
                items={list.items.map((i) => ({ id: i.id, name: i.name, done: i.done }))}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
