"use client";

import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { translate } from "@/lib/i18n/messages";
import { createContext, useCallback, useContext, useMemo } from "react";

type I18nContextValue = {
  locale: AppLocale;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = useCallback((key: string) => translate(messages, key), [messages]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
