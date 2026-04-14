/** URL pubblico dell’app (link nelle email). */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  return "http://localhost:3000";
}
