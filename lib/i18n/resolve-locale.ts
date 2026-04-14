import { DEFAULT_LOCALE, type AppLocale, isAppLocale, SUPPORTED_LOCALES } from "@/lib/i18n/config";

/** Mappa tag Accept-Language (prefisso) → locale app. */
const PREFIX_MAP: Record<string, AppLocale> = {
  it: "it",
  en: "en",
  "en-gb": "en",
  "en-us": "en",
  es: "es",
  "es-mx": "es",
  fr: "fr",
  "fr-ca": "fr",
  de: "de",
  pt: "pt",
  "pt-br": "pt",
  nl: "nl",
  pl: "pl",
  ru: "ru",
  ja: "ja",
  zh: "zh",
  "zh-cn": "zh",
  "zh-tw": "zh",
  ko: "ko",
  ar: "ar",
  tr: "tr",
  hi: "hi",
  uk: "uk",
  ro: "ro",
};

/**
 * Sceglie la prima lingua supportata dall’header Accept-Language.
 */
export function pickLocaleFromAcceptLanguage(acceptLanguage: string | null | undefined): AppLocale {
  if (!acceptLanguage?.trim()) return DEFAULT_LOCALE;
  const parts = acceptLanguage.split(",").map((p) => p.trim().split(";")[0]?.toLowerCase() ?? "");
  for (const raw of parts) {
    if (!raw) continue;
    if (isAppLocale(raw)) return raw;
    const short = raw.split("-")[0] ?? "";
    const mapped = PREFIX_MAP[raw] ?? PREFIX_MAP[short];
    if (mapped) return mapped;
    if (isAppLocale(short)) return short;
  }
  return DEFAULT_LOCALE;
}

export function normalizeLocaleCookie(value: string | null | undefined): AppLocale {
  if (value && isAppLocale(value)) return value;
  return DEFAULT_LOCALE;
}
