import { cookies, headers } from "next/headers";
import { cache } from "react";

import { LOCALE_COOKIE_NAME, type AppLocale, isAppLocale } from "@/lib/i18n/config";
import { loadMessages, translate, type Messages } from "@/lib/i18n/messages";
import { pickLocaleFromAcceptLanguage } from "@/lib/i18n/resolve-locale";

export const getRequestLocale = cache(async (): Promise<AppLocale> => {
  const c = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  if (c && isAppLocale(c)) return c;
  const al = (await headers()).get("accept-language");
  return pickLocaleFromAcceptLanguage(al);
});

export const getMessages = cache(async (): Promise<Messages> => {
  const locale = await getRequestLocale();
  return loadMessages(locale);
});

export async function createTranslator(): Promise<{ locale: AppLocale; t: (key: string) => string }> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    locale,
    t: (key: string) => translate(messages, key),
  };
}
