import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Iscrizione incompleta." }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? null;

  await prisma.webPushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId: session.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: ua,
    },
    update: {
      userId: session.user.id,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
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

  if (body.endpoint) {
    await prisma.webPushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint: body.endpoint },
    });
  } else {
    await prisma.webPushSubscription.deleteMany({
      where: { userId: session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
