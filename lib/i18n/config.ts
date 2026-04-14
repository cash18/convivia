/** Cookie persistenza lingua (leggibile da middleware Edge). */
export const LOCALE_COOKIE_NAME = "cv_locale";

/** Lingue supportate (BCP-47 compatibile per `lang`, cookie usa codice breve). */
export const SUPPORTED_LOCALES = [
  "it",
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "nl",
  "pl",
  "ru",
  "ja",
  "zh",
  "ko",
  "ar",
  "tr",
  "hi",
  "uk",
  "ro",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "it";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  ru: "Русский",
  ja: "日本語",
  zh: "中文",
  ko: "한국어",
  ar: "العربية",
  tr: "Türkçe",
  hi: "हिन्दी",
  uk: "Українська",
  ro: "Română",
};

export function isAppLocale(s: string | undefined | null): s is AppLocale {
  return !!s && (SUPPORTED_LOCALES as readonly string[]).includes(s);
}
