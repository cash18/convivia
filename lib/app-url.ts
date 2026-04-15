import { headers } from "next/headers";

/** URL pubblico dell’app (link nelle email). Preferisci il dominio definitivo (es. .it), non *.vercel.app. */
export function getAppBaseUrl(): string {
  for (const raw of [process.env.NEXT_PUBLIC_APP_URL?.trim(), process.env.AUTH_URL?.trim()]) {
    if (!raw) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  return "http://localhost:3000";
}

/**
 * URL base coerente con la richiesta corrente (inviti, pagine server).
 * Utile quando il browser è su un host diverso da NEXT_PUBLIC_APP_URL.
 */
export async function getAppBaseUrlFromRequest(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    /* fuori da una richiesta Next */
  }
  return getAppBaseUrl();
}
