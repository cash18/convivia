"use server";

import { compare } from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LoginActionResult =
  | { ok: true }
  | { error: "INVALID" }
  | { error: "UNVERIFIED" }
  | { error: "SIGNIN_FAILED" };

export async function signInWithPassword(email: string, password: string): Promise<LoginActionResult> {
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
  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirect: false,
    });
  } catch {
    return { error: "SIGNIN_FAILED" };
  }
  return { ok: true };
}
