"use client";

import { LAST_HOUSE_ID_KEY } from "@/lib/last-house-preference";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Fallback se il cookie non è ancora disponibile (es. prima sync) ma c’è localStorage.
 * Il redirect principale avviene lato server in `case/page.tsx` tramite cookie.
 */
export function CaseLastHouseRedirect({ memberHouseIds }: { memberHouseIds: string[] }) {
  const router = useRouter();
  const done = useRef(false);

  useLayoutEffect(() => {
    if (done.current || memberHouseIds.length === 0) return;
    try {
      const last = localStorage.getItem(LAST_HOUSE_ID_KEY);
      if (last && memberHouseIds.includes(last)) {
        done.current = true;
        router.replace(`/casa/${last}`);
      }
    } catch {
      /* ignore */
    }
  }, [memberHouseIds, router]);

  return null;
}
