import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");

  const label = session.user.name ?? session.user.email ?? "Utente";

  return <AppShell userName={label}>{children}</AppShell>;
}
