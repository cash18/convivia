import { CaseLastHouseRedirect } from "@/components/CaseLastHouseRedirect";
import { CreateHouseForm } from "@/components/CreateHouseForm";
import { JoinHouseForm } from "@/components/JoinHouseForm";
import { auth } from "@/auth";
import { roleLabelKey } from "@/lib/house-roles";
import { createTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CasePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { t } = await createTranslator();

  const memberships = await prisma.houseMember.findMany({
    where: { userId: session.user.id },
    include: { house: true },
    orderBy: { joinedAt: "desc" },
  });

  const memberHouseIds = memberships.map((m) => m.houseId);

  return (
    <div className="space-y-8 sm:space-y-10">
      <CaseLastHouseRedirect memberHouseIds={memberHouseIds} />
      <div>
        <p className="cv-badge w-fit">{t("case.badge")}</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("case.title")}</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">{t("case.intro")}</p>
      </div>

      {memberships.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/casa/${m.houseId}`}
                className="cv-card-solid group block p-5 transition hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.2)] sm:p-6"
              >
                <span className="text-lg font-bold text-slate-900 group-hover:text-emerald-900">{m.house.name}</span>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {t(roleLabelKey(m.role))} · {t("case.codeLabel")}{" "}
                  <span className="font-mono text-emerald-700">{m.house.inviteCode}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cv-card rounded-2xl border border-dashed border-emerald-200/60 bg-emerald-50/30 px-6 py-10 text-center text-sm font-medium text-slate-600">
          {t("case.empty")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateHouseForm />
        <JoinHouseForm />
      </div>
    </div>
  );
}
