import { CasaLastHouseSync } from "@/components/CasaLastHouseSync";
import { CasaSubNav } from "@/components/CasaSubNav";
import { auth } from "@/auth";
import { getMembershipOrRedirect } from "@/lib/house-access";

export default async function CasaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getMembershipOrRedirect(houseId, session.user.id);

  return (
    <div className="min-w-0">
      <CasaLastHouseSync houseId={houseId} />
      <CasaSubNav
        houseId={houseId}
        houseName={membership.house.name}
        inviteCode={membership.house.inviteCode}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
