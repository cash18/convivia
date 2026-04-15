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
