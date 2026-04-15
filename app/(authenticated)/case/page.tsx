import { CaseAddHousePanel } from "@/components/CaseAddHousePanel";
import { CaseHouseCardLink } from "@/components/CaseHouseCardLink";
import { auth } from "@/auth";
import { roleLabelKey } from "@/lib/house-roles";
import { createTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CasePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { t } = await createTranslator();

  const memberships = await prisma.houseMember.findMany({
    where: { userId: session.user.id },
    include: { house: true },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-4">
      <header className="flex flex-col gap-8 border-b border-emerald-200/25 pb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl sm:leading-[1.15]">
            {t("case.title")}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-600">{t("case.intro")}</p>
        </div>
        <div className="shrink-0 sm:max-w-sm sm:pt-1">
          <CaseAddHousePanel />
        </div>
      </header>

      {memberships.length > 0 ? (
        <section aria-label={t("case.homesListAria")}>
          <ul className="grid gap-5 sm:grid-cols-2">
            {memberships.map((m) => (
              <li key={m.id}>
                <CaseHouseCardLink
                  houseId={m.houseId}
                  className="min-h-[6.5rem] border-l-[6px] border-l-emerald-500 pl-5 sm:min-h-[7.25rem]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-900 sm:text-2xl">
                        {m.house.name}
                      </span>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {t(roleLabelKey(m.role))}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span>
                          {t("case.codeLabel")}{" "}
                          <span className="font-mono text-sm font-bold text-emerald-700">{m.house.inviteCode}</span>
                        </span>
                      </p>
                    </div>
                    <span
                      className="mt-1 shrink-0 text-lg font-light text-emerald-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </CaseHouseCardLink>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section
          className="cv-card-solid flex flex-col items-center justify-center border-dashed border-emerald-200/70 bg-gradient-to-b from-emerald-50/40 to-white/90 px-6 py-16 text-center shadow-inner"
          aria-live="polite"
        >
          <p className="text-lg font-bold text-slate-900">{t("case.emptyTitle")}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("case.emptySubtitle")}</p>
        </section>
      )}
    </div>
  );
}
