import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validatePushSubscriptionInput } from "@/lib/push-subscription-validate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const sub = (body as { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } })
    .subscription;
  if (!sub) {
    return NextResponse.json({ error: "Iscrizione incompleta." }, { status: 400 });
  }
  const valid = validatePushSubscriptionInput(sub);
  if (!valid.ok) {
    return NextResponse.json({ error: valid.message }, { status: 400 });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 512) ?? null;
  const endpoint = sub.endpoint!.trim();
  const p256dh = sub.keys!.p256dh!.trim();
  const authKey = sub.keys!.auth!.trim();

  await prisma.webPushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: ua,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth: authKey,
      userAgent: ua,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: { endpoint?: string } = {};
  try {
    body = (await req.json()) as { endpoint?: string };
  } catch {
    /* opzionale */
  }

  const ep = typeof body.endpoint === "string" ? body.endpoint.trim().slice(0, 2048) : "";
  if (ep) {
    await prisma.webPushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint: ep },
    });
  } else {
    await prisma.webPushSubscription.deleteMany({
      where: { userId: session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
