import { getAppBaseUrl } from "@/lib/app-url";
import { emailFooter } from "@/lib/email";

export function verificationEmailContent(token: string): { subject: string; html: string; text: string; previewUrl: string } {
  const base = getAppBaseUrl();
  const url = `${base}/verifica-email?token=${encodeURIComponent(token)}`;
  const subject = "Conferma il tuo indirizzo email — Convivia";
  const text = `Ciao,\n\nPer attivare il tuo account Convivia apri questo link (valido 48 ore):\n${url}${emailFooter()}`;
  const html = `<p>Ciao,</p><p>Per <strong>attivare il tuo account</strong> Convivia clicca il pulsante qui sotto (link valido 48 ore).</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Conferma email</a></p><p>Oppure copia questo indirizzo nel browser:<br/><span style="word-break:break-all;font-size:13px;">${url}</span></p><p style="color:#64748b;font-size:13px;">Se non hai creato tu l’account, ignora questa email.</p>`;
  return { subject, html, text, previewUrl: url };
}

export function passwordResetEmailContent(token: string): { subject: string; html: string; text: string; previewUrl: string } {
  const base = getAppBaseUrl();
  const url = `${base}/reimposta-password/${encodeURIComponent(token)}`;
  const subject = "Reimposta la password — Convivia";
  const text = `Hai richiesto una nuova password.\n\nApri questo link (valido 1 ora):\n${url}\n\nSe non sei stato tu, ignora questa email.${emailFooter()}`;
  const html = `<p>Hai richiesto di <strong>reimpostare la password</strong> del portale Convivia.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Scegli nuova password</a></p><p style="color:#64748b;font-size:13px;">Il link scade tra un’ora. Se non hai richiesto tu il reset, ignora questa email.</p>`;
  return { subject, html, text, previewUrl: url };
}

export function houseInviteEmailContent(opts: {
  token: string;
  houseName: string;
  inviterName: string;
}): { subject: string; html: string; text: string; previewUrl: string } {
  const base = getAppBaseUrl();
  const url = `${base}/invito-casa?token=${encodeURIComponent(opts.token)}`;
  const subject = `Invito a unirti a «${opts.houseName}» — Convivia`;
  const text = `${opts.inviterName} ti ha invitato nella casa «${opts.houseName}» su Convivia.\n\nApri il link (valido 7 giorni):\n${url}${emailFooter()}`;
  const html = `<p><strong>${escapeHtml(opts.inviterName)}</strong> ti ha invitato nella casa <strong>«${escapeHtml(opts.houseName)}»</strong> su Convivia.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Accetta invito</a></p><p style="color:#64748b;font-size:13px;">Link valido 7 giorni. Dovrai accedere con l’indirizzo email a cui è stato inviato l’invito.</p>`;
  return { subject, html, text, previewUrl: url };
}

export function ownershipTransferEmailContent(opts: {
  token: string;
  houseName: string;
  fromName: string;
}): { subject: string; html: string; text: string; previewUrl: string } {
  const base = getAppBaseUrl();
  const url = `${base}/trasferimento-proprieta?token=${encodeURIComponent(opts.token)}`;
  const subject = `Richiesta di proprietà per «${opts.houseName}» — Convivia`;
  const text = `${opts.fromName} ti chiede di diventare amministratore (proprietario) della casa «${opts.houseName}».\n\nApri il link per accettare o rifiutare (valido 14 giorni):\n${url}${emailFooter()}`;
  const html = `<p><strong>${escapeHtml(opts.fromName)}</strong> ti chiede di diventare <strong>amministratore</strong> (proprietario) della casa <strong>«${escapeHtml(opts.houseName)}»</strong>.</p><p>Accettando, l’attuale amministratore diventerà membro come gli altri.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Vedi richiesta</a></p><p style="color:#64748b;font-size:13px;">Link valido 14 giorni.</p>`;
  return { subject, html, text, previewUrl: url };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
