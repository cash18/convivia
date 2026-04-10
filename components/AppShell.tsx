import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/case" className="text-lg font-semibold text-emerald-950">
              Convivia
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link
                href="/case"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Le mie case
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="max-w-[12rem] truncate text-sm text-zinc-600">{userName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
