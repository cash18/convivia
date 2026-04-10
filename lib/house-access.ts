import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getMembershipOrRedirect(houseId: string, userId: string) {
  const membership = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
    include: {
      house: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });
  if (!membership) redirect("/case");
  return membership;
}
