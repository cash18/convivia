"use client";

import { clearLastHouseOnClient } from "@/lib/last-house-preference";
import Link from "next/link";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  href?: string;
};

/**
 * Link verso l’elenco case: niente prefetch (evita richieste anticipate a / case)
 * e reset del cookie «ultima casa» al tap così / non rimanda subito alla stessa casa.
 */
export function CaseListNavLink({ href = "/case", onClick, ...rest }: Props) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(e) => {
        clearLastHouseOnClient();
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
