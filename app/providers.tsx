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
    <SessionProvider>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
      <PwaClient />
    </SessionProvider>
  );
}
