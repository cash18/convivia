import { auth } from "@/auth";
import { HouseMembersPanel } from "@/components/HouseMembersPanel";
import { getMembershipOrRedirect } from "@/lib/house-access";
import { prisma } from "@/lib/prisma";

export default async function CasaMembriPage({ params }: { params: Promise<{ houseId: string }> }) {
  const { houseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getMembershipOrRedirect(houseId, session.user.id);

  const pendingTransfers = await prisma.houseOwnershipTransfer.findMany({
    where: { houseId, status: "PENDING" },
    include: {
      toUser: { select: { name: true, email: true } },
      fromUser: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const membersPayload = membership.house.members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));

  const pendingPayload = pendingTransfers.map((p) => ({
    id: p.id,
    fromUserId: p.fromUserId,
    toName: p.toUser.name?.trim() || p.toUser.email,
    toEmail: p.toUser.email,
    fromLabel: p.fromUser.name?.trim() || p.fromUser.email,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="cv-badge w-fit">Membri e accessi</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Gestione membri</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Il <strong className="font-semibold text-slate-800">proprietario</strong> gestisce il trasferimento del ruolo.
          I <strong className="font-semibold text-slate-800">supervisionatori</strong> possono invitare e rimuovere i
          membri standard. Gli inviti e i trasferimenti passano da email.
        </p>
      </header>

      <HouseMembersPanel
        houseId={houseId}
        actorUserId={session.user.id}
        actorRole={membership.role}
        members={membersPayload}
        pendingTransfers={pendingPayload}
      />
    </div>
  );
}
