/** Chiave condivisa: localStorage + cookie (stesso nome) per ultima casa visitata. */
export const LAST_HOUSE_ID_KEY = "convivia_last_house_id";

export const LAST_HOUSE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

export function persistLastHouseOnClient(houseId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_HOUSE_ID_KEY, houseId);
    const secure = window.location.protocol === "https:";
    document.cookie = `${LAST_HOUSE_ID_KEY}=${encodeURIComponent(houseId)}; Path=/; Max-Age=${LAST_HOUSE_MAX_AGE_SEC}; SameSite=Lax${secure ? "; Secure" : ""}`;
  } catch {
    /* ignore */
  }
}

export function clearLastHouseOnClient(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_HOUSE_ID_KEY);
    document.cookie = `${LAST_HOUSE_ID_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}
