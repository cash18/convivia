import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { PushNotificationsClient } from "@/components/PushNotificationsClient";
import Link from "next/link";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/45 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))]">
          <div className="flex items-center gap-4">
            <Link href="/case">
              <BrandLogo />
            </Link>
            <nav className="flex flex-wrap gap-1">
              <Link href="/case" className="cv-pill-nav">
                Le mie case
              </Link>
              <Link href="/impostazioni" className="cv-pill-nav">
                Impostazioni
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <PushNotificationsClient />
            <span className="max-w-[12rem] truncate text-sm font-medium text-slate-600">{userName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 py-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))]">
        {children}
      </div>
    </div>
  );
}
