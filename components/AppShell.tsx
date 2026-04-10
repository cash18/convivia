import { BrandLogo } from "@/components/BrandLogo";
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
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/case">
              <BrandLogo />
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link href="/case" className="cv-pill-nav">
                Le mie case
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="max-w-[12rem] truncate text-sm font-medium text-slate-600">{userName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
