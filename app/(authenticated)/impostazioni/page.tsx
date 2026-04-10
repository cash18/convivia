import { NotificationPreferencesForm } from "@/components/NotificationPreferencesForm";
import { auth } from "@/auth";
import { normalizePushNotifyPrefs } from "@/lib/push-categories";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ImpostazioniPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushNotifyPrefs: true },
  });

  const prefs = normalizePushNotifyPrefs(user?.pushNotifyPrefs ?? null);
  const vapidConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <p className="cv-badge w-fit">Portale utente</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Impostazioni</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gestisci le notifiche push per categoria. Valgono per tutte le case di cui fai parte. Chi ha compiuto
          l&apos;azione non riceve la propria notifica.
        </p>
      </div>

      <section className="cv-card-solid space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-extrabold text-slate-900">Dispositivo e permessi</h2>
        <p className="text-xs leading-relaxed text-slate-600">
          Attiva le notifiche sul browser o sull&apos;app installata (PWA). Le categorie qui sotto filtrano solo cosa
          viene inviato agli altri membri quando succede qualcosa in una casa.
        </p>
        {vapidConfigured ? (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-xs leading-relaxed text-slate-700">
            Per <strong>accettare le notifiche</strong> su questo telefono o computer usa il pulsante{" "}
            <strong>«Notifiche casa»</strong> in alto a destra (è disponibile in tutte le pagine dopo l&apos;accesso).
            Le caselle qui sotto decidono solo <em>quali tipi di avviso</em> ricevere quando altri membri agiscono.
          </p>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Le notifiche push non sono configurate sul server (mancano le chiavi VAPID). Contatta chi gestisce il
            deploy.
          </p>
        )}
      </section>

      <section className="cv-card-solid space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-extrabold text-slate-900">Categorie di notifica</h2>
        <p className="text-xs leading-relaxed text-slate-600">
          Disattiva le categorie che non vuoi ricevere come push. Le modifiche si applicano ai prossimi eventi.
        </p>
        <NotificationPreferencesForm prefs={prefs} />
      </section>

      <p className="text-center text-xs text-slate-500">
        <Link href="/case" className="cv-link font-medium">
          ← Torna alle case
        </Link>
      </p>
    </div>
  );
}
