import { BrandLogo } from "@/components/BrandLogo";
import { verifyEmailWithToken } from "@/lib/actions/verify-email";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";

  let title = "Verifica email";
  let body: React.ReactNode = (
    <p className="text-sm text-slate-600">
      Link non valido. Controlla di aver copiato l’intero indirizzo dall’email oppure richiedi una nuova conferma dalla
      pagina di accesso.
    </p>
  );

  if (token) {
    const r = await verifyEmailWithToken(token);
    if ("ok" in r && r.ok) {
      title = "Email confermata";
      body = (
        <div className="space-y-4 text-sm text-slate-600">
          <p className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 font-medium text-emerald-900">
            Il tuo account è attivo. Ora puoi accedere con email e password.
          </p>
          <Link href="/accedi" className="cv-btn-primary inline-flex w-full justify-center px-4 py-3 text-center">
            Vai all’accesso
          </Link>
        </div>
      );
    } else if ("error" in r) {
      title = "Verifica non riuscita";
      body = (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{r.error}</p>
      );
    }
  }

  return (
    <div className="relative flex min-h-dvh min-h-screen flex-col items-center justify-center px-4 py-12 pt-[env(safe-area-inset-top,0px)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(52,211,153,0.2),transparent_50%),radial-gradient(ellipse_at_20%_70%,rgba(20,184,166,0.18),transparent_45%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BrandLogo className="scale-110" />
          </Link>
        </div>
        <div className="cv-card p-8 sm:p-9">
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          <div className="mt-6">{body}</div>
          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
              ← Torna alla home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
