import { CaseListNavLink } from "@/components/CaseListNavLink";
import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { auth } from "@/auth";
import { normalizePushNotifyPrefs } from "@/lib/push-categories";
import { createTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
export default async function ImpostazioniPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { t } = await createTranslator();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushNotifyPrefs: true },
  });

  const prefs = normalizePushNotifyPrefs(user?.pushNotifyPrefs ?? null);
  const vapidConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <p className="cv-badge w-fit">{t("settings.badge")}</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("settings.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("settings.intro")}</p>
      </div>

      <section className="cv-card-solid space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-extrabold text-slate-900">{t("settings.deviceTitle")}</h2>
        <p className="text-xs leading-relaxed text-slate-600">{t("settings.deviceBody")}</p>
        {vapidConfigured ? (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-xs leading-relaxed text-slate-700">
            {t("settings.vapidOn")}
          </p>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("settings.vapidOff")}</p>
        )}
      </section>

      <section className="cv-card-solid space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-extrabold text-slate-900">{t("settings.categoriesTitle")}</h2>
        <p className="text-xs leading-relaxed text-slate-600">{t("settings.categoriesBody")}</p>
        <NotificationPreferencesForm prefs={prefs} />
      </section>

      <p className="text-center text-xs text-slate-500">
        <CaseListNavLink className="cv-link font-medium">
          {t("settings.backCases")}
        </CaseListNavLink>
      </p>
    </div>
  );
}
