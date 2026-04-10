import { CreateHouseForm } from "@/components/CreateHouseForm";
import { JoinHouseForm } from "@/components/JoinHouseForm";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CasePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.houseMember.findMany({
    where: { userId: session.user.id },
    include: { house: true },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Le tue case</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Crea una casa nuova o entra con il codice che ti ha condiviso un coinquilino.
        </p>
      </div>

      {memberships.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/casa/${m.houseId}`}
                className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <span className="text-lg font-semibold text-zinc-900">{m.house.name}</span>
                <p className="mt-1 text-xs text-zinc-500">
                  {m.role === "OWNER" ? "Amministratore" : "Membro"} · codice {m.house.inviteCode}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          Non sei ancora in nessuna casa. Creane una o unisciti con un codice invito.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateHouseForm />
        <JoinHouseForm />
      </div>
    </div>
  );
}
