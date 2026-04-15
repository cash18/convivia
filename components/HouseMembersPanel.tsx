"use client";

import { useI18n } from "@/components/I18nProvider";
import {
  cancelHouseOwnershipTransfer,
  demoteHouseSupervisor,
  inviteHouseMemberByEmail,
  promoteHouseSupervisor,
  removeHouseMember,
  requestHouseOwnershipTransfer,
} from "@/lib/actions/members";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import {
  canManageHouseMembers,
  canPromoteSupervisor,
  canRemoveMember,
  HouseRole,
  isOwnerRole,
} from "@/lib/house-roles";
import { InviteLinkShareRow } from "@/components/InviteLinkShareRow";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const { t, locale } = useI18n();
  const intlTag = useMemo(() => intlLocaleTag(locale), [locale]);
  const router = useRouter();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteShareUrl, setInviteShareUrl] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);

  function showFlash(payload: { type: "ok" | "err"; text: string }) {
    setMsg(payload);
    setTimeout(() => setMsg(null), 6000);
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteBusy(true);
    setInviteShareUrl(null);
    const r = await inviteHouseMemberByEmail(houseId, inviteEmail);
    setInviteBusy(false);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    setInviteEmail("");
    setInviteShareUrl(r.inviteUrl);
    showFlash({ type: "ok", text: t("membersPage.msgInviteSent") });
    router.refresh();
  }

  async function onTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferTo) return;
    setTransferBusy(true);
    const r = await requestHouseOwnershipTransfer(houseId, transferTo);
    setTransferBusy(false);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    setTransferTo("");
    showFlash({ type: "ok", text: t("membersPage.msgTransferSent") });
    router.refresh();
  }

  async function cancelTransfer(id: string) {
    const r = await cancelHouseOwnershipTransfer(houseId, id);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    showFlash({ type: "ok", text: t("membersPage.msgCancelled") });
    router.refresh();
  }

  async function remove(targetUserId: string, targetName: string) {
    if (!confirm(formatMessage(t("membersPage.removeConfirm"), { name: targetName }))) return;
    const r = await removeHouseMember(houseId, targetUserId);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    showFlash({ type: "ok", text: t("membersPage.msgRemoved") });
    router.refresh();
  }

  async function promote(targetUserId: string) {
    const r = await promoteHouseSupervisor(houseId, targetUserId);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    showFlash({ type: "ok", text: t("membersPage.msgPromoted") });
    router.refresh();
  }

  async function demote(targetUserId: string) {
    const r = await demoteHouseSupervisor(houseId, targetUserId);
    if ("error" in r) {
      showFlash({ type: "err", text: r.error });
      return;
    }
    showFlash({ type: "ok", text: t("membersPage.msgDemoted") });
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
          <h2 className="text-lg font-bold text-slate-900">{t("membersPage.pendingTitle")}</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            {pendingTransfers.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong className="text-slate-800">{p.fromLabel}</strong> →{" "}
                  <strong className="text-slate-800">{p.toName}</strong> ({p.toEmail}) —{" "}
                  {new Date(p.createdAt).toLocaleString(intlTag)}
                </span>
                {p.fromUserId === actorUserId ? (
                  <button
                    type="button"
                    onClick={() => void cancelTransfer(p.id)}
                    className="cv-btn-outline shrink-0 px-3 py-1.5 text-xs"
                  >
                    {t("membersPage.cancelRequest")}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canManageHouseMembers(actorRole) ? (
        <section className="cv-card-solid space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">{t("membersPage.inviteTitle")}</h2>
          <p className="text-sm text-slate-600">{t("membersPage.inviteHint")}</p>
          <p className="text-xs leading-relaxed text-slate-500">{t("membersPage.inviteLinkIntro")}</p>
          <form onSubmit={(e) => void onInvite(e)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
              {t("membersPage.inviteEmail")}
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
                required
                className="cv-input"
                placeholder={t("membersPage.inviteEmailPlaceholder")}
              />
            </label>
            <button type="submit" disabled={inviteBusy} className="cv-btn-primary shrink-0 px-5 py-2.5">
              {inviteBusy ? t("membersPage.inviteSending") : t("membersPage.inviteSend")}
            </button>
          </form>
          {inviteShareUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">{t("membersPage.inviteLinkTitle")}</p>
              <InviteLinkShareRow href={inviteShareUrl} />
              <p className="text-[11px] leading-snug text-slate-500">{t("membersPage.inviteLinkHint")}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {isOwnerRole(actorRole) ? (
        <section className="cv-card-solid space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">{t("membersPage.transferTitle")}</h2>
          <p className="text-sm text-slate-600">{t("membersPage.transferHint")}</p>
          <form onSubmit={(e) => void onTransfer(e)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
              {t("membersPage.transferSelect")}
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                required
                className="cv-input"
              >
                <option value="">{t("membersPage.transferSelectPlaceholder")}</option>
                {transferTargets.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={transferBusy || transferTargets.length === 0} className="cv-btn-outline shrink-0 px-5 py-2.5">
              {transferBusy ? t("membersPage.transferSending") : t("membersPage.transferSend")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="cv-card-solid overflow-hidden">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">{t("membersPage.membersTitle")}</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const roleLabel =
              m.role === HouseRole.OWNER
                ? t("membersPage.roleOwner")
                : m.role === HouseRole.SUPERVISOR
                  ? t("membersPage.roleSupervisor")
                  : t("membersPage.roleMember");
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
                      {t("membersPage.promote")}
                    </button>
                  ) : null}
                  {showDemote ? (
                    <button
                      type="button"
                      onClick={() => void demote(m.userId)}
                      className="cv-btn-outline px-3 py-1.5 text-xs"
                    >
                      {t("membersPage.demote")}
                    </button>
                  ) : null}
                  {showRemove ? (
                    <button
                      type="button"
                      onClick={() => void remove(m.userId, m.name)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
                    >
                      {t("membersPage.remove")}
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
