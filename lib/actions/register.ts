"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Minimo 8 caratteri"),
  name: z.string().min(1).max(80),
});

export type RegisterState = { error?: string; ok?: boolean };

export async function registerUser(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.password?.[0] ?? "Dati non validi." };
  }
  const { email, password, name } = parsed.data;
  const exists = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (exists) return { error: "Questa email è già registrata." };
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await hash(password, 12),
      name: name.trim(),
    },
  });
  return { ok: true };
}
