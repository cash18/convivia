"use server";

import { compare } from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeAppCallbackTarget } from "@/lib/sanitize-callback-url";

export type LoginActionResult =
  | { ok: true }
  | { error: "INVALID" }
  | { error: "UNVERIFIED" }
  | { error: "SIGNIN_FAILED" };

export async function signInWithPassword(
  email: string,
  password: string,
  callbackPath?: string | null,
): Promise<LoginActionResult> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "INVALID" };
  }
  if (!user.emailVerifiedAt) {
    return { error: "UNVERIFIED" };
  }
  const redirectTo = sanitizeAppCallbackTarget(callbackPath ?? undefined, "/");
  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirect: false,
      redirectTo,
    });
  } catch {
    return { error: "SIGNIN_FAILED" };
  }
  return { ok: true };
}
