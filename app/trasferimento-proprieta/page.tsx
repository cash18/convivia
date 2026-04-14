import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { HouseOwnershipTransferClient } from "@/components/HouseOwnershipTransferClient";
import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TrasferimentoProprietaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";
  const session = await auth();
  const { t } = await createTranslator();

  let inner: ReactNode = (
    <div className="cv-card p-8 sm:p-9">
      <h1 className="text-2xl font-extrabold text-slate-900">{t("transferPage.invalidTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("transferPage.invalidBody")}</p>
    </div>
  );

  if (token) {
    const tr = await prisma.houseOwnershipTransfer.findUnique({
      where: { token },
      include: {
        house: { select: { name: true } },
        fromUser: { select: { name: true, email: true } },
        toUser: { select: { id: true } },
      },
    });
    if (tr && tr.status === "PENDING" && tr.expiresAt.getTime() >= Date.now()) {
      const fromName = tr.fromUser.name?.trim() || tr.fromUser.email;
      const isRecipient = !!session?.user?.id && session.user.id === tr.toUser.id;
      inner = (
        <HouseOwnershipTransferClient
          token={token}
          houseName={tr.house.name}
          fromName={fromName}
          isLoggedIn={!!session?.user}
          isRecipient={isRecipient}
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
            {t("transferPage.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
