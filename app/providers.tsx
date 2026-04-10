"use client";

import { PwaClient } from "@/components/PwaClient";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PwaClient />
    </SessionProvider>
  );
}
