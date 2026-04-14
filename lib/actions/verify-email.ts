"use server";

import { ta } from "@/lib/i18n/action-messages";
import { prisma } from "@/lib/prisma";
import { newSecureToken } from "@/lib/crypto-token";
import { sendTransactionalEmail } from "@/lib/email";
import { verificationEmailContent } from "@/lib/email-messages";

export async function verifyEmailWithToken(
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = token.trim();
  if (!trimmed) return { error: await ta("errors.invalidLink") };

  const row = await prisma.emailVerificationToken.findUnique({
    where: { token: trimmed },
    include: { user: true },
  });
  if (!row) return { error: await ta("errors.verifyLinkInvalid") };
  if (row.expiresAt.getTime() < Date.now()) {
    return { error: await ta("errors.verifyLinkExpired") };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: row.userId },
    }),
  ]);

  return { ok: true };
}

/** Invia di nuovo il link di verifica (utente non ancora verificato). */
export async function resendVerificationEmail(email: string): Promise<{ ok: true } | { error: string }> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (!user) return { ok: true };
  if (user.emailVerifiedAt) return { ok: true };

  const token = newSecureToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const content = verificationEmailContent(token);
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    devPreviewUrl: content.previewUrl,
  });
  if (!sent.ok) return { error: await ta("errors.verifyResendFailed") };
  return { ok: true };
}
