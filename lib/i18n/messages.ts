import type { AppLocale } from "@/lib/i18n/config";

export type Messages = Record<string, unknown>;

function deepMerge<T extends Record<string, unknown>>(base: T, over: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(over)) {
    const bv = out[k];
    const ov = over[k];
    if (
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[k] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
    } else if (ov !== undefined) {
      out[k] = ov;
    }
  }
  return out as T;
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(messages: Messages, key: string): string {
  const v = getNested(messages, key);
  return v ?? key;
}

type MessageModule = { default: Messages };

const cache = new Map<string, Promise<Messages>>();

async function loadEnBase(): Promise<Messages> {
  const m = (await import("@/messages/en.json")) as MessageModule;
  return m.default as Messages;
}

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const hit = cache.get(locale);
  if (hit) return hit;

  const p = (async () => {
    const enBase = await loadEnBase();
    if (locale === "en") return structuredClone(enBase);
    try {
      const mod = (await import(`@/messages/${locale}.json`)) as MessageModule;
      return deepMerge(enBase, mod.default as Record<string, unknown>);
    } catch {
      return structuredClone(enBase);
    }
  })();

  cache.set(locale, p);
  return p;
}
