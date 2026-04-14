"use client";

import { acceptHouseEmailInvite } from "@/lib/actions/members";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HouseInviteClient({
  token,
  houseName,
  inviteEmail,
  isLoggedIn,
  sessionEmail,
}: {
  token: string;
  houseName: string;
  inviteEmail: string;
  isLoggedIn: boolean;
  sessionEmail: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const emailsMatch =
    sessionEmail && inviteEmail.toLowerCase() === sessionEmail.toLowerCase();

  async function accept() {
    setError(null);
    setPending(true);
    const r = await acceptHouseEmailInvite(token);
    setPending(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    router.push(`/casa/${r.houseId}`);
    router.refresh();
  }

  return (
    <div className="cv-card p-8 sm:p-9">
      <h1 className="text-2xl font-extrabold text-slate-900">Invito alla casa</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sei stato invitato a unirti a <strong className="text-slate-800">«{houseName}»</strong>. L’invito è valido per
        l’indirizzo <strong className="font-mono text-emerald-900">{inviteEmail}</strong>.
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <p className="text-sm text-slate-600">Accedi o crea un account con la stessa email dell’invito.</p>
            <Link
              href={`/accedi?callbackUrl=${encodeURIComponent(`/invito-casa?token=${encodeURIComponent(token)}`)}`}
              className="cv-btn-primary block w-full py-3 text-center"
            >
              Accedi
            </Link>
            <Link href={`/registrati?invito=${encodeURIComponent(token)}`} className="cv-btn-outline block w-full py-3 text-center">
              Crea account
            </Link>
          </>
        ) : emailsMatch ? (
          <button type="button" disabled={pending} onClick={() => void accept()} className="cv-btn-primary w-full py-3">
            {pending ? "Entrata in corso…" : "Accetta e unisciti alla casa"}
          </button>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Sei connesso come <span className="font-mono">{sessionEmail}</span>. Esci e accedi con{" "}
            <span className="font-mono">{inviteEmail}</span>, oppure crea un nuovo account con quell’email.
          </p>
        )}
      </div>
    </div>
  );
}
