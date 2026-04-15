"use client";

import { persistLastHouseOnClient } from "@/lib/last-house-preference";
import { useEffect } from "react";

export function CasaLastHouseSync({ houseId }: { houseId: string }) {
  useEffect(() => {
    persistLastHouseOnClient(houseId);
  }, [houseId]);
  return null;
}
