import { addDaysToDateKey, utcCalendarDateKey } from "@/lib/calendar-all-day";

/** Indice del turno (0 = anchor, poi +everyDays, …). -1 se la data non è sul calendario della ricorrenza. */
export function rotationSlotIndex(anchorAtDb: Date, everyDays: number, occurrenceDateKey: string): number {
  const anchorKey = utcCalendarDateKey(anchorAtDb);
  if (occurrenceDateKey < anchorKey) return -1;
  let k = anchorKey;
  let i = 0;
  while (k < occurrenceDateKey) {
    k = addDaysToDateKey(k, everyDays);
    i++;
  }
  return k === occurrenceDateKey ? i : -1;
}

export function defaultAssigneeForSlot(
  membersOrdered: { userId: string }[],
  slotIndex: number,
): string | null {
  if (membersOrdered.length === 0) return null;
  return membersOrdered[slotIndex % membersOrdered.length]!.userId;
}

export function effectiveAssigneeUserId(
  membersOrdered: { userId: string }[],
  anchorAtDb: Date,
  everyDays: number,
  occurrenceDateKey: string,
  swapAssigneeId: string | undefined,
): string | null {
  if (swapAssigneeId) return swapAssigneeId;
  const slot = rotationSlotIndex(anchorAtDb, everyDays, occurrenceDateKey);
  if (slot < 0) return null;
  return defaultAssigneeForSlot(membersOrdered, slot);
}

/** Chiavi YYYY-MM-DD (UTC civile, come anchor DB) da fromKey a toKey inclusive su griglia anchor + n·everyDays. */
export function occurrenceDateKeysInRange(
  anchorAtDb: Date,
  everyDays: number,
  fromKey: string,
  toKey: string,
): string[] {
  const anchorKey = utcCalendarDateKey(anchorAtDb);
  const out: string[] = [];
  let k = anchorKey;
  while (k < fromKey) {
    k = addDaysToDateKey(k, everyDays);
  }
  while (k <= toKey) {
    out.push(k);
    k = addDaysToDateKey(k, everyDays);
  }
  return out;
}

export type ChorePreviewRow = {
  dateKey: string;
  assigneeId: string;
  assigneeName: string;
  isSwapped: boolean;
};

/** Prossime occorrenze da oggi (UTC date key) per UI Compiti. */
export function previewUpcomingAssignments(
  anchorAtDb: Date,
  everyDays: number,
  membersOrdered: { userId: string; name: string }[],
  swapsByKey: Map<string, string>,
  maxRows: number,
): ChorePreviewRow[] {
  const todayKey = utcCalendarDateKey(new Date());
  const toKey = addDaysToDateKey(todayKey, 400);
  const keys = occurrenceDateKeysInRange(anchorAtDb, everyDays, todayKey, toKey);
  const uids = membersOrdered.map((m) => ({ userId: m.userId }));
  const out: ChorePreviewRow[] = [];
  for (const k of keys.slice(0, maxRows)) {
    const swapId = swapsByKey.get(k);
    const assigneeId = effectiveAssigneeUserId(uids, anchorAtDb, everyDays, k, swapId) ?? "";
    const assigneeName = membersOrdered.find((m) => m.userId === assigneeId)?.name ?? "?";
    out.push({ dateKey: k, assigneeId, assigneeName, isSwapped: Boolean(swapId) });
  }
  return out;
}

