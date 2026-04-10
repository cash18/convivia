# Convivia

**Convivia** è il portale web per coinquilini: **case multi-utente**, **spese condivise** (con ripartizione e saldi), **calendario**, **liste della spesa** e **compiti assegnabili** — in linea con l’idea di app come Flatify o OurHome.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Prisma](https://www.prisma.io/) + **PostgreSQL** (obbligatorio: in locale e su [Vercel](https://vercel.com/) usa ad es. [Neon](https://neon.tech/))
- [Auth.js / NextAuth](https://authjs.dev/) (credenziali email + password)

## Avvio locale

1. Crea un database Postgres (consigliato: progetto gratuito su [Neon](https://neon.tech/)).
2. Copia le connection string dalla dashboard (usa **pooled** per `DATABASE_URL` e **direct** per `DIRECT_URL` se Neon te le fornisce distinte; altrimenti la stessa stringa *direct* va bene per entrambe in sviluppo).
3. Configura l’ambiente:

```bash
# dalla root del repository
cp .env.example .env
# Modifica .env: DATABASE_URL, DIRECT_URL, AUTH_SECRET (es. openssl rand -base64 32), AUTH_URL=http://localhost:3000
npm install
npx prisma migrate deploy
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): registrati, crea una casa o unisciti con il **codice invito** mostrato nella panoramica casa.

## Deploy su Vercel (profilo personale)

1. **Login CLI** (una tantum): `npx vercel login`
2. **Collega la cartella al progetto** (crea `convivia` su Vercel se non esiste):

```bash
npx vercel link --yes --project convivia
```

3. Nel [dashboard Vercel](https://vercel.com/dashboard) → progetto **convivia** → **Storage** / **Integrations**, aggiungi **Neon** e collegalo al progetto (oppure crea un database Neon e copia le stringhe a mano).
4. Imposta le **variabili d’ambiente** sul progetto (Production + Preview se vuoi):

| Variabile | Note |
|-----------|------|
| `DATABASE_URL` | Connection string Postgres (su Neon di solito *pooled* / transaction) |
| `DIRECT_URL` | Connection string *direct* (per `prisma migrate deploy` in build); in sviluppo può coincidere con `DATABASE_URL` |
| `AUTH_SECRET` | Stesso valore sicuro che usi in locale (`openssl rand -base64 32`) |
| `AUTH_URL` | URL del sito, es. `https://convivia-xxx.vercel.app` (aggiorna dopo il primo deploy se cambia dominio) |

5. **Sincronizza in locale** (opzionale): `npx vercel env pull .env.local`
6. **Deploy**: `npx vercel --prod` oppure push su GitHub se il repo è collegato a Vercel con deploy automatici.

Il file `vercel.json` imposta la build come `prisma migrate deploy && next build`, così le migrazioni Prisma girano su Postgres ad ogni deploy.

## Script utili

| Comando | Descrizione |
|--------|-------------|
| `npm run dev` | Server di sviluppo (Turbopack) |
| `npm run build` | Migrazioni + build di produzione |
| `npm run db:studio` | Interfaccia dati Prisma |
| `npx vercel` | Anteprima deploy; `npx vercel --prod` per produzione |

## Note

- Valuta email magic link o OAuth oltre alle password per un uso reale.
- Il saldo mostrato è **indicativo** (pagato − quota ripartita); non sostituisce accordi tra coinquilini.
