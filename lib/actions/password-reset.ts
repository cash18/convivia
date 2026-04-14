"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { newSecureToken } from "@/lib/crypto-token";
import { sendTransactionalEmail } from "@/lib/email";
import { passwordResetEmailContent } from "@/lib/email-messages";

/** Non rivela se l’email esiste (stesso messaggio di successo). */
export async function requestPasswordReset(email: string): Promise<{ ok: true } | { error: string }> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (!user) return { ok: true };

  const token = newSecureToken();
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const content = passwordResetEmailContent(token);
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    devPreviewUrl: content.previewUrl,
  });
  if (!sent.ok) return { error: "Invio email non riuscito. Riprova più tardi." };
  return { ok: true };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = token.trim();
  if (trimmed.length < 20) return { error: "Link non valido." };
  if (newPassword.length < 8) return { error: "La password deve avere almeno 8 caratteri." };

  const row = await prisma.passwordResetToken.findUnique({
    where: { token: trimmed },
  });
  if (!row) return { error: "Link non valido o già usato." };
  if (row.expiresAt.getTime() < Date.now()) {
    return { error: "Link scaduto. Richiedi un nuovo reset dalla pagina di accesso." };
  }

  const passwordHash = await hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId },
    }),
  ]);

  return { ok: true };
}
