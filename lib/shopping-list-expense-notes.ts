/** Prefisso stabile nelle note spesa create da una lista (prima riga descrittiva + righe articoli). */
export const SHOPPING_LIST_NOTES_MARKER = "__CV_SHOP_LIST__\n";

export function buildShoppingListExpenseNotes(introLine: string, itemLines: string[]): string {
  return `${SHOPPING_LIST_NOTES_MARKER}${introLine}\n${itemLines.join("\n")}`;
}

export type ParsedExpenseNotes =
  | { kind: "shopping_list"; headline: string; items: string[] }
  | { kind: "plain"; text: string };

function stripBullet(line: string): string {
  return line.replace(/^\s*[·•*\-–—]\s*/, "").trim();
}

/** Heuristica per spese create prima dell’introduzione del marker. */
function isLegacyShoppingListIntroLine(line: string): boolean {
  const s = line.trim();
  if (!s.includes("«") || !s.includes("»")) return false;
  if (!/[—–-]/.test(s)) return false;
  return /lista\s+spesa|shopping\s+list|liste\s+spesa/i.test(s);
}

export function parseExpenseNotes(notes: string | null | undefined): ParsedExpenseNotes {
  const raw = notes ?? "";
  if (!raw.trim()) return { kind: "plain", text: "" };

  if (raw.startsWith(SHOPPING_LIST_NOTES_MARKER)) {
    const body = raw.slice(SHOPPING_LIST_NOTES_MARKER.length);
    const lines = body.split(/\r?\n/).map((l) => l.trimEnd());
    const headline = lines[0]?.trim() ?? "";
    const items = lines
      .slice(1)
      .map((l) => stripBullet(l.trim()))
      .filter(Boolean);
    return { kind: "shopping_list", headline, items };
  }

  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
  const first = lines[0]?.trim() ?? "";
  if (first && isLegacyShoppingListIntroLine(first)) {
    const items = lines
      .slice(1)
      .map((l) => stripBullet(l.trim()))
      .filter(Boolean);
    return { kind: "shopping_list", headline: first, items };
  }

  return { kind: "plain", text: raw };
}
