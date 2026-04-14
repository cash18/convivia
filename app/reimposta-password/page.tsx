import { BrandLogo } from "@/components/BrandLogo";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { createTranslator } from "@/lib/i18n/server";
import Link from "next/link";

export default async function ForgotPasswordPage() {
  const { t } = await createTranslator();

  return (
    <div className="relative flex min-h-dvh min-h-screen flex-col items-center justify-center px-4 py-12 pt-[env(safe-area-inset-top,0px)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(5,150,105,0.2),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(20,184,166,0.18),transparent_45%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BrandLogo className="scale-110" />
          </Link>
        </div>
        <div className="cv-card p-8 sm:p-9">
          <h1 className="text-2xl font-extrabold text-slate-900">{t("passwordRequestPage.title")}</h1>
          <p className="mt-1 text-sm text-slate-600">{t("passwordRequestPage.lead")}</p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/accedi" className="cv-link">
              {t("passwordRequestPage.backLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
