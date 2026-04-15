"use client";

import { I18nProvider } from "@/components/I18nProvider";
import { PwaClient } from "@/components/PwaClient";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={5 * 60}>
      <I18nProvider locale={locale} messages={messages}>
        {children}
        <PwaClient />
      </I18nProvider>
    </SessionProvider>
  );
}
