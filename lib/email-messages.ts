import { getAppBaseUrl } from "@/lib/app-url";
import { emailFooter } from "@/lib/email";

function firstNameFromDisplay(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return parts[0] ?? "";
}

/**
 * Email di benvenuto dopo la registrazione (in aggiunta alla mail di verifica).
 * L’immagine è servita da `/public/email/welcome-hero.png` con URL assoluto.
 */
export function welcomeGreetingEmailContent(displayName: string): { subject: string; html: string; text: string } {
  const base = getAppBaseUrl();
  const heroUrl = `${base}/email/welcome-hero.png`;
  const accediUrl = `${base}/accedi`;
  const rawFirst = firstNameFromDisplay(displayName);
  const subject = rawFirst ? `Benvenuto su Convivia, ${rawFirst}!` : "Benvenuto su Convivia!";
  const text = `${rawFirst ? `Ciao ${rawFirst}` : "Ciao"},\n\nti ringraziamo per esserti registrato su Convivia, il portale per condividere la casa in modo semplice.\n\nDa quando avrai confermato l’email (messaggio separato con il link) potrai:\n• creare una nuova casa oppure unirti con un codice invito o un invito via email;\n• registrare le spese condivise e vedere i saldi tra coinquilini;\n• usare il calendario condiviso, le liste spesa e i compiti;\n• ricevere notifiche push per restare aggiornato.\n\nAccedi qui quando sei pronto: ${accediUrl}${emailFooter()}`;
  const safeFirst = rawFirst ? escapeHtml(rawFirst) : "";
  const lead = rawFirst
    ? `<p style="margin:0 0 16px;font-size:17px;line-height:1.45;color:#0f172a;">Ciao <strong>${safeFirst}</strong>,</p>`
    : `<p style="margin:0 0 16px;font-size:17px;line-height:1.45;color:#0f172a;">Ciao,</p>`;
  const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#0f172a;line-height:1.5;">
  <img src="${heroUrl}" alt="Convivia: spese, calendario e casa condivisa" width="560" style="max-width:100%;height:auto;display:block;border-radius:14px;margin:0 0 20px;border:0;" />
  ${lead}
  <p style="margin:0 0 14px;font-size:15px;color:#334155;">Grazie per esserti registrato su <strong>Convivia</strong>. Ti abbiamo anche inviato un’<strong>email separata</strong> con il link per <strong>confermare l’indirizzo email</strong>: senza quel passaggio non potrai ancora accedere.</p>
  <p style="margin:0 0 10px;font-size:15px;color:#334155;">Una volta attivo l’account potrai:</p>
  <ul style="margin:0 0 18px;padding-left:1.25rem;font-size:15px;color:#334155;">
    <li style="margin-bottom:6px;">creare una <strong>casa</strong> o unirti con <strong>codice invito</strong> / invito via email;</li>
    <li style="margin-bottom:6px;">gestire le <strong>spese condivise</strong> e i saldi tra coinquilini;</li>
    <li style="margin-bottom:6px;">usare <strong>calendario</strong>, <strong>liste spesa</strong> e <strong>compiti</strong>;</li>
    <li>attivare le <strong>notifiche push</strong> per non perdere gli aggiornamenti.</li>
  </ul>
  <p style="margin:0 0 18px;"><a href="${accediUrl}" style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Vai alla pagina di accesso</a></p>
  <p style="margin:0;font-size:13px;color:#64748b;">Se non hai creato tu l’account, ignora questa email.</p>
</div>`.trim();
  return { subject, html, text };
}

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
