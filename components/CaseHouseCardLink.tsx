"use client";

import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useState } from "react";

export function CaseHouseCardLink({
  houseId,
  children,
  className = "",
}: {
  houseId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const [navigating, setNavigating] = useState(false);

  return (
    <Link
      href={`/casa/${houseId}`}
      scroll
      aria-busy={navigating}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        setNavigating(true);
      }}
      data-navigating={navigating ? "true" : undefined}
      className={`cv-card-solid group relative block touch-manipulation overflow-hidden border-emerald-100/70 p-5 transition hover:border-emerald-200/90 hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.22)] active:scale-[0.99] active:brightness-[0.98] sm:p-6 data-[navigating=true]:pointer-events-none data-[navigating=true]:scale-[0.99] data-[navigating=true]:opacity-80 data-[navigating=true]:ring-2 data-[navigating=true]:ring-emerald-400/60 ${className}`}
    >
      {navigating ? (
        <p className="mb-2 animate-pulse text-center text-[11px] font-semibold text-emerald-800">{t("case.openingHouse")}</p>
      ) : null}
      {children}
    </Link>
  );
}
