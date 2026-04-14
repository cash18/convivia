"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { ta } from "@/lib/i18n/action-messages";
import { prisma } from "@/lib/prisma";
import { newSecureToken } from "@/lib/crypto-token";
import { sendTransactionalEmail } from "@/lib/email";
import { verificationEmailContent } from "@/lib/email-messages";

export type RegisterState = { error?: string; ok?: boolean };

export async function registerUser(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const minPw = await ta("errors.registerPasswordMin");
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8, minPw),
    name: z.string().min(1).max(80),
  });

  const inviteTokenRaw = String(formData.get("inviteToken") ?? "").trim();
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.password?.[0] ?? (await ta("errors.invalidData")) };
  }
  const { email, password, name } = parsed.data;
  const emailLower = email.toLowerCase();

  if (inviteTokenRaw) {
    const inv = await prisma.houseEmailInvite.findFirst({
      where: {
        token: inviteTokenRaw,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!inv) return { error: await ta("errors.invalidInviteOrExpired") };
    if (inv.email.toLowerCase() !== emailLower) {
      return { error: await ta("errors.emailMustMatchInvite") };
    }
  }

  const exists = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  if (exists) return { error: await ta("errors.emailAlreadyRegistered") };

  const verifyToken = newSecureToken();
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash: await hash(password, 12),
      name: name.trim(),
      emailVerifiedAt: null,
      emailVerificationTokens: {
        create: {
          token: verifyToken,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      },
    },
  });

  const content = verificationEmailContent(verifyToken);
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    devPreviewUrl: content.previewUrl,
  });
  if (!sent.ok) {
    await prisma.user.delete({ where: { id: user.id } });
    return { error: await ta("errors.verificationEmailFailed") };
  }

  return { ok: true };
}
