"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const STORAGE_KEY = "convivia_last_house_id";

export function CaseLastHouseRedirect({ memberHouseIds }: { memberHouseIds: string[] }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || memberHouseIds.length === 0) return;
    try {
      const last = localStorage.getItem(STORAGE_KEY);
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
