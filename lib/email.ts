import { getAppBaseUrl } from "@/lib/app-url";

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Invio transazionale via [Resend](https://resend.com) (solo HTTP, nessuna dipendenza npm).
 * Senza `RESEND_API_KEY` l’email non parte: in sviluppo compare un log con l’URL del link.
 */
export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Per log dev quando l’invio è saltato */
  devPreviewUrl?: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? "Convivia <onboarding@resend.dev>";

  if (!key) {
    console.warn(
      "[email] RESEND_API_KEY mancante — email non inviata:",
      opts.to,
      opts.subject,
      opts.devPreviewUrl ? `preview: ${opts.devPreviewUrl}` : "",
    );
    return { ok: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: body || `Resend HTTP ${res.status}` };
  }
  return { ok: true };
}

export function emailFooter(): string {
  const base = getAppBaseUrl();
  return `\n\n—\nConvivia\n${base}\n`;
}
