/**
 * Validazione minima endpoint Web Push (HTTPS in produzione, lunghezze chiavi).
 * Mitiga body arbitrari verso `WebPushSubscription`.
 */

const MAX_ENDPOINT_LEN = 2048;
const MAX_KEY_LEN = 512;

export function validatePushSubscriptionInput(sub: {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}): { ok: true } | { ok: false; message: string } {
  const endpoint = sub.endpoint?.trim();
  if (!endpoint || endpoint.length > MAX_ENDPOINT_LEN) {
    return { ok: false, message: "Endpoint non valido." };
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false, message: "Endpoint non valido." };
  }

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && url.protocol !== "https:") {
    return { ok: false, message: "Endpoint deve usare HTTPS." };
  }
  if (!isProd && url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, message: "Endpoint non valido." };
  }
  if (!isProd && url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    return { ok: false, message: "Solo localhost per HTTP in sviluppo." };
  }

  const p256dh = sub.keys?.p256dh?.trim();
  const auth = sub.keys?.auth?.trim();
  if (!p256dh || !auth || p256dh.length > MAX_KEY_LEN || auth.length > MAX_KEY_LEN) {
    return { ok: false, message: "Chiavi iscrizione incomplete." };
  }

  return { ok: true };
}
