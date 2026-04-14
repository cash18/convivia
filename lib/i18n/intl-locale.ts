import type { AppLocale } from "@/lib/i18n/config";

/** Tag BCP-47 per `Intl` / `toLocaleDateString` in base alla lingua app. */
export function intlLocaleTag(locale: AppLocale): string {
  const map: Record<AppLocale, string> = {
    it: "it-IT",
    en: "en-GB",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    pt: "pt-PT",
    nl: "nl-NL",
    pl: "pl-PL",
    ru: "ru-RU",
    ja: "ja-JP",
    zh: "zh-CN",
    ko: "ko-KR",
    ar: "ar-SA",
    tr: "tr-TR",
    hi: "hi-IN",
    uk: "uk-UA",
    ro: "ro-RO",
  };
  return map[locale] ?? "en-GB";
}
