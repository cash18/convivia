import { BrandLogo } from "@/components/BrandLogo";
import { RegisterForm } from "@/components/RegisterForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invito?: string }>;
}) {
  const sp = await searchParams;
  const invito = sp.invito?.trim();
  let inviteToken: string | null = null;
  let lockedEmail: string | null = null;
  if (invito) {
    const inv = await prisma.houseEmailInvite.findFirst({
      where: {
        token: invito,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (inv) {
      inviteToken = inv.token;
      lockedEmail = inv.email;
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
          <h1 className="text-2xl font-extrabold text-slate-900">Crea account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Unisciti a Convivia e sincronizza la tua casa con i coinquilini.
            {inviteToken ? (
              <>
                {" "}
                Stai creando l’account per accettare un <strong className="font-semibold text-slate-800">invito via
                email</strong>: dopo la registrazione conferma l’indirizzo email, poi apri di nuovo il link dell’invito
                dalla posta.
              </>
            ) : null}
          </p>
          <div className="mt-6">
            <RegisterForm inviteToken={inviteToken} lockedEmail={lockedEmail} />
          </div>
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
