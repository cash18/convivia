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
        <p className="cv-badge w-fit">Le tue case</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Sincronizza gli spazi</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Crea una casa nuova o entra con il codice che ti ha condiviso un coinquilino.
        </p>
      </div>

      {memberships.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/casa/${m.houseId}`}
                className="cv-card-solid group block p-6 transition hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.22)]"
              >
                <span className="text-lg font-bold text-slate-900 group-hover:text-indigo-900">{m.house.name}</span>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {m.role === "OWNER" ? "Amministratore" : "Membro"} · codice{" "}
                  <span className="font-mono text-violet-700">{m.house.inviteCode}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cv-card rounded-2xl border border-dashed border-violet-200/60 bg-violet-50/30 px-6 py-10 text-center text-sm font-medium text-slate-600">
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
