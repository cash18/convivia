import { NewShoppingListForm } from "@/components/NewShoppingListForm";
import { ShoppingListCard } from "@/components/ShoppingListCard";
import { auth } from "@/auth";
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

  await getMembershipOrRedirect(houseId, session.user.id);

  const lists = await prisma.shoppingList.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <div className="cv-card-solid p-5 sm:p-6">
        <NewShoppingListForm houseId={houseId} />
      </div>

      {lists.length === 0 ? (
        <p className="text-sm font-medium text-slate-500">Nessuna lista. Creane una per iniziare la spesa condivisa.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              houseId={houseId}
              listId={list.id}
              name={list.name}
              items={list.items.map((i) => ({ id: i.id, name: i.name, done: i.done }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
