"use client";

import {
  cancelHouseOwnershipTransfer,
  demoteHouseSupervisor,
  inviteHouseMemberByEmail,
  promoteHouseSupervisor,
  removeHouseMember,
  requestHouseOwnershipTransfer,
} from "@/lib/actions/members";
import {
  canManageHouseMembers,
  canPromoteSupervisor,
  canRemoveMember,
  HouseRole,
  isOwnerRole,
} from "@/lib/house-roles";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MemberRow = { userId: string; name: string; email: string; role: string };

type PendingTransfer = {
  id: string;
  fromUserId: string;
  toName: string;
  toEmail: string;
  fromLabel: string;
  createdAt: string;
};

export function HouseMembersPanel({
  houseId,
  actorUserId,
  actorRole,
  members,
  pendingTransfers,
}: {
  houseId: string;
  actorUserId: string;
  actorRole: string;
  members: MemberRow[];
  pendingTransfers: PendingTransfer[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);

  function flash(t: { type: "ok" | "err"; text: string }) {
    setMsg(t);
    setTimeout(() => setMsg(null), 6000);
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteBusy(true);
    const r = await inviteHouseMemberByEmail(houseId, inviteEmail);
    setInviteBusy(false);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    setInviteEmail("");
    flash({ type: "ok", text: "Invito inviato per email." });
    router.refresh();
  }

  async function onTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferTo) return;
    setTransferBusy(true);
    const r = await requestHouseOwnershipTransfer(houseId, transferTo);
    setTransferBusy(false);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    setTransferTo("");
    flash({ type: "ok", text: "Richiesta inviata: il destinatario riceverà un’email per confermare." });
    router.refresh();
  }

  async function cancelTransfer(id: string) {
    const r = await cancelHouseOwnershipTransfer(houseId, id);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    flash({ type: "ok", text: "Richiesta annullata." });
    router.refresh();
  }

  async function remove(targetUserId: string, targetName: string) {
    if (!confirm(`Rimuovere ${targetName} dalla casa?`)) return;
    const r = await removeHouseMember(houseId, targetUserId);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    flash({ type: "ok", text: "Membro rimosso." });
    router.refresh();
  }

  async function promote(targetUserId: string) {
    const r = await promoteHouseSupervisor(houseId, targetUserId);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    flash({ type: "ok", text: "Supervisionatore nominato." });
    router.refresh();
  }

  async function demote(targetUserId: string) {
    const r = await demoteHouseSupervisor(houseId, targetUserId);
    if ("error" in r) {
      flash({ type: "err", text: r.error });
      return;
    }
    flash({ type: "ok", text: "Ruolo aggiornato a membro." });
    router.refresh();
  }

  const transferTargets = members.filter((m) => m.userId !== actorUserId && !isOwnerRole(m.role));

  return (
    <div className="space-y-8">
      {msg ? (
        <p
          className={
            msg.type === "ok"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          }
        >
          {msg.text}
        </p>
      ) : null}

      {pendingTransfers.length > 0 ? (
        <section className="cv-card-solid space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Trasferimenti in sospeso</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            {pendingTransfers.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong className="text-slate-800">{p.fromLabel}</strong> →{" "}
                  <strong className="text-slate-800">{p.toName}</strong> ({p.toEmail}) —{" "}
                  {new Date(p.createdAt).toLocaleString("it-IT")}
                </span>
                {p.fromUserId === actorUserId ? (
                  <button
                    type="button"
                    onClick={() => void cancelTransfer(p.id)}
                    className="cv-btn-outline shrink-0 px-3 py-1.5 text-xs"
                  >
                    Annulla richiesta
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canManageHouseMembers(actorRole) ? (
        <section className="cv-card-solid space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Invita per email</h2>
          <p className="text-sm text-slate-600">
            Invia un link di invito valido 7 giorni. La persona dovrà accedere con la stessa email.
          </p>
          <form onSubmit={(e) => void onInvite(e)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
              Email
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
                required
                className="cv-input"
                placeholder="nome@esempio.it"
              />
            </label>
            <button type="submit" disabled={inviteBusy} className="cv-btn-primary shrink-0 px-5 py-2.5">
              {inviteBusy ? "Invio…" : "Invia invito"}
            </button>
          </form>
        </section>
      ) : null}

      {isOwnerRole(actorRole) ? (
        <section className="cv-card-solid space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Trasferisci proprietà</h2>
          <p className="text-sm text-slate-600">
            Scegli un membro già presente in casa. Riceverà un’email per accettare o rifiutare. Finché non accetta, resti
            amministratore.
          </p>
          <form onSubmit={(e) => void onTransfer(e)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
              Nuovo proprietario
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                required
                className="cv-input"
              >
                <option value="">— Seleziona —</option>
                {transferTargets.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={transferBusy || transferTargets.length === 0} className="cv-btn-outline shrink-0 px-5 py-2.5">
              {transferBusy ? "Invio…" : "Invia richiesta"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="cv-card-solid overflow-hidden">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">Membri</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const roleLabel =
              m.role === HouseRole.OWNER ? "Proprietario" : m.role === HouseRole.SUPERVISOR ? "Supervisionatore" : "Membro";
            const showRemove =
              m.userId !== actorUserId && canRemoveMember(actorRole, m.role) && !isOwnerRole(m.role);
            const showPromote =
              canPromoteSupervisor(actorRole) && m.role === HouseRole.MEMBER && m.userId !== actorUserId;
            const showDemote =
              canPromoteSupervisor(actorRole) && m.role === HouseRole.SUPERVISOR && m.userId !== actorUserId;

            return (
              <li key={m.userId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="truncate text-sm text-slate-500">{m.email}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-700">{roleLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {showPromote ? (
                    <button
                      type="button"
                      onClick={() => void promote(m.userId)}
                      className="cv-btn-outline px-3 py-1.5 text-xs"
                    >
                      Nomina supervisionatore
                    </button>
                  ) : null}
                  {showDemote ? (
                    <button
                      type="button"
                      onClick={() => void demote(m.userId)}
                      className="cv-btn-outline px-3 py-1.5 text-xs"
                    >
                      Togli supervisionatore
                    </button>
                  ) : null}
                  {showRemove ? (
                    <button
                      type="button"
                      onClick={() => void remove(m.userId, m.name)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
                    >
                      Rimuovi
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
