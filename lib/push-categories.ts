/**
 * Categorie notifiche push (allineate alle azioni in `lib/actions/*`).
 * Valore assente o `null` sul profilo = tutte attive (default).
 */

export const PUSH_NOTIFY_CATEGORIES = ["EXPENSES", "CALENDAR", "TASKS", "LISTS", "HOUSE"] as const;

export type PushNotifyCategory = (typeof PUSH_NOTIFY_CATEGORIES)[number];

export const PUSH_CATEGORY_LABELS: Record<PushNotifyCategory, string> = {
  EXPENSES: "Spese",
  CALENDAR: "Calendario",
  TASKS: "Compiti",
  LISTS: "Liste spesa",
  HOUSE: "Casa e membri",
};

export const PUSH_CATEGORY_DESCRIPTIONS: Record<PushNotifyCategory, string> = {
  EXPENSES: "Nuove spese ed eliminazioni nel registro della casa.",
  CALENDAR: "Eventi aggiunti o rimossi dal calendario condiviso.",
  TASKS: "Compiti creati, completati o eliminati.",
  LISTS: "Nuove liste e articoli aggiunti alle liste spesa.",
  HOUSE: "Quando qualcuno entra in una casa con il codice invito.",
};

const ALL_TRUE: Record<PushNotifyCategory, boolean> = {
  EXPENSES: true,
  CALENDAR: true,
  TASKS: true,
  LISTS: true,
  HOUSE: true,
};

/** Legge il JSON salvato e restituisce un record completo (default true). */
export function normalizePushNotifyPrefs(raw: unknown): Record<PushNotifyCategory, boolean> {
  const out = { ...ALL_TRUE };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  for (const k of PUSH_NOTIFY_CATEGORIES) {
    const v = o[k];
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

export function userAcceptsPushCategory(prefsJson: unknown, category: PushNotifyCategory): boolean {
  return normalizePushNotifyPrefs(prefsJson)[category];
}
