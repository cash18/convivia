/**
 * Consente solo percorsi relativi interni (stesso host del browser).
 * Blocca URL assoluti e open-redirect verso altri domini.
 */
export function sanitizeAppCallbackTarget(raw: string | null | undefined, fallback = "/case"): string {
  if (raw == null || raw === "") return fallback;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return fallback;
  }
  s = s.trim();
  if (s.length > 2048) return fallback;
  if (s.includes("\0") || s.includes("\r") || s.includes("\n")) return fallback;
  if (s.includes("://") || s.startsWith("//")) return fallback;
  if (!s.startsWith("/")) return fallback;
  if (s.startsWith("/\\") || s.startsWith("/@")) return fallback;
  return s;
}
