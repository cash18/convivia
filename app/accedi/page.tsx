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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Accedi</h1>
        <p className="mt-1 text-sm text-zinc-600">Portale Convivia</p>
        {sp.registrato === "1" ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Account creato. Ora puoi accedere con email e password.
          </p>
        ) : null}
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-zinc-500">Caricamento form…</p>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Non hai un account?{" "}
          <Link href="/registrati" className="font-medium text-emerald-800 underline">
            Registrati
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </div>
  );
}
