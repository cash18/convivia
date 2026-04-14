import { BrandLogo } from "@/components/BrandLogo";
import { HouseInviteClient } from "@/components/HouseInviteClient";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InvitoCasaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";
  const session = await auth();

  let inner: React.ReactNode = (
    <div className="cv-card p-8 sm:p-9">
      <h1 className="text-2xl font-extrabold text-slate-900">Invito non valido</h1>
      <p className="mt-2 text-sm text-slate-600">Manca il token nell’URL o il link non è più valido.</p>
    </div>
  );

  if (token) {
    const inv = await prisma.houseEmailInvite.findUnique({
      where: { token },
      include: { house: { select: { name: true } } },
    });
    if (inv && !inv.usedAt && inv.expiresAt.getTime() >= Date.now()) {
      inner = (
        <HouseInviteClient
          token={token}
          houseName={inv.house.name}
          inviteEmail={inv.email}
          isLoggedIn={!!session?.user}
          sessionEmail={session?.user?.email ?? null}
        />
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
        {inner}
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </div>
  );
}
