import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");

  const { t } = await createTranslator();
  const label = session.user.name ?? session.user.email ?? t("common.defaultUserName");

  return <AppShell userName={label}>{children}</AppShell>;
}
