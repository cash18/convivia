"use client";

import { useEffect } from "react";

const STORAGE_KEY = "convivia_last_house_id";

export function CasaLastHouseSync({ houseId }: { houseId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, houseId);
    } catch {
      /* ignore */
    }
  }, [houseId]);
  return null;
}
