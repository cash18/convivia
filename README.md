# Convivia

Portale web per coinquilini: **case multi-utente**, **spese condivise** (con ripartizione e saldi), **calendario**, **liste della spesa** e **compiti assegnabili** — in linea con l’idea di app come Flatify o OurHome.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Prisma](https://www.prisma.io/) + SQLite (adatto allo sviluppo; in produzione conviene PostgreSQL)
- [Auth.js / NextAuth](https://authjs.dev/) (credenziali email + password)

## Avvio locale

```bash
cd convivia
cp .env.example .env
# Imposta AUTH_SECRET (es. openssl rand -base64 32) e DATABASE_URL se diversi
npm install
npx prisma migrate dev
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): registrati, crea una casa o unisciti con il **codice invito** mostrato nella panoramica casa.

## Script utili

| Comando | Descrizione |
|--------|-------------|
| `npm run dev` | Server di sviluppo (Turbopack) |
| `npm run build` | Build di produzione |
| `npm run db:studio` | Interfaccia dati Prisma |

## Note

- Per un deploy reale: database gestito (es. Neon), `AUTH_SECRET` sicuro, e valutazione di email magic link o OAuth oltre alle password.
- Il saldo mostrato è **indicativo** (pagato − quota ripartita); non sostituisce accordi tra coinquilini.
