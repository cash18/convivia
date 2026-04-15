"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  href?: string;
};

/**
 * Link verso l’elenco case (`/case`). Prefetch disattivato per evitare richieste anticipate.
 * Non cancelliamo l’ultima casa visitata: così alla riapertura dell’app `/` può ancora
 * reindirizzare lì (cookie + localStorage da `CasaLastHouseSync`), mentre `/case` resta
 * raggiungibile da qui senza essere “espulsi” dalla pagina elenco.
 */
export function CaseListNavLink({ href = "/case", onClick, ...rest }: Props) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
