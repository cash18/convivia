import { LandingPage } from "@/components/LandingPage";
import { auth } from "@/auth";
import { LAST_HOUSE_ID_KEY } from "@/lib/last-house-preference";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return <LandingPage />;

  const lastFromCookie = (await cookies()).get(LAST_HOUSE_ID_KEY)?.value;
  if (lastFromCookie) {
    const membership = await prisma.houseMember.findUnique({
      where: { userId_houseId: { userId: session.user.id, houseId: lastFromCookie } },
      select: { houseId: true },
    });
    if (membership) redirect(`/casa/${membership.houseId}`);
  }

  redirect("/case");
}
