import { BrandLogo } from "@/components/BrandLogo";
import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";
import { Suspense } from "react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registrato?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(139,92,246,0.2),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(34,211,238,0.18),transparent_45%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BrandLogo className="scale-110" />
          </Link>
        </div>
        <div className="cv-card p-8 sm:p-9">
          <h1 className="text-2xl font-extrabold text-slate-900">Accedi</h1>
          <p className="mt-1 text-sm text-slate-600">Benvenuto di nuovo su Convivia</p>
          {sp.registrato === "1" ? (
            <p className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900">
              Account creato. Ora puoi accedere con email e password.
            </p>
          ) : null}
          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-slate-500">Caricamento form…</p>}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Non hai un account?{" "}
            <Link href="/registrati" className="cv-link">
              Registrati
            </Link>
          </p>
          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
              ← Torna alla home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
