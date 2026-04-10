/**
 * Importa le spese dal report “Complete financial report” (Aprile 2026).
 *
 * Uso:
 *   HOUSE_ID=<id casa> npx tsx scripts/import-financial-report.ts
 *   HOUSE_ID=... npx tsx scripts/import-financial-report.ts --force   # rimuove import precedenti con stesso tag e reimporta
 *
 * Richiede che nella casa ci siano membri con nomi che contengono "Andrea" e "Francesco"
 * (es. Andrea Cascina, Francesco Marchese).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMPORT_NOTE = "Da report finanziario Aprile 2026";

type Payer = "andrea" | "francesco";

type Row = {
  expenseDate: Date;
  payer: Payer;
  title: string;
  amountEuro: number;
};

/** Date in formato del report (M/D/YYYY, ora 12h). */
function dt(month: number, day: number, year: number, hour12: number, minute: number, ampm: "AM" | "PM"): Date {
  let h = hour12 % 12;
  if (ampm === "PM") h += 12;
  if (ampm === "AM" && hour12 === 12) h = 0;
  return new Date(year, month - 1, day, h, minute, 0, 0);
}

const ROWS: Row[] = [
  { expenseDate: dt(4, 3, 2026, 3, 26, "PM"), payer: "andrea", title: "Spesa casa (roba cucina + decalcificante)", amountEuro: 41.7 },
  { expenseDate: dt(4, 2, 2026, 12, 39, "AM"), payer: "andrea", title: "Happy casa", amountEuro: 85.18 },
  { expenseDate: dt(4, 2, 2026, 12, 37, "AM"), payer: "andrea", title: "Ikea", amountEuro: 95.55 },
  { expenseDate: dt(3, 30, 2026, 10, 54, "PM"), payer: "francesco", title: "Pagamento (senza descrizione)", amountEuro: 220 },
  { expenseDate: dt(3, 30, 2026, 9, 54, "AM"), payer: "andrea", title: "Mobile ingresso", amountEuro: 72 },
  { expenseDate: dt(3, 29, 2026, 10, 30, "PM"), payer: "francesco", title: "Spesa per casa", amountEuro: 42 },
  { expenseDate: dt(3, 29, 2026, 7, 17, "PM"), payer: "francesco", title: "Spesa varie pulizie casa", amountEuro: 45 },
  { expenseDate: dt(3, 29, 2026, 12, 15, "AM"), payer: "andrea", title: "Cena Poke", amountEuro: 30 },
  { expenseDate: dt(3, 29, 2026, 12, 13, "AM"), payer: "francesco", title: "Pulizie", amountEuro: 30 },
  { expenseDate: dt(3, 29, 2026, 12, 8, "AM"), payer: "andrea", title: "Installazione router wifi", amountEuro: 40 },
];

function euroToCents(e: number): number {
  return Math.round(e * 100);
}

async function main() {
  const houseId = process.env.HOUSE_ID?.trim();
  if (!houseId) {
    console.error("Imposta HOUSE_ID (id della casa in Convivia). Trovi l’id nell’URL: /casa/[houseId]/...");
    process.exit(1);
  }

  const force = process.argv.includes("--force");

  const members = await prisma.houseMember.findMany({
    where: { houseId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (members.length < 2) {
    console.error("La casa deve avere almeno 2 membri (Andrea e Francesco).");
    process.exit(1);
  }

  const andrea = members.find((m) => m.user.name.toLowerCase().includes("andrea"));
  const francesco = members.find((m) => m.user.name.toLowerCase().includes("francesco"));

  if (!andrea || !francesco) {
    console.error(
      'Non trovo membri con "Andrea" e "Francesco" nel nome. Membri attuali:',
      members.map((m) => m.user.name).join(", "),
    );
    process.exit(1);
  }
  if (andrea.userId === francesco.userId) {
    console.error("Andrea e Francesco risolvono allo stesso utente. Controlla i nomi.");
    process.exit(1);
  }

  if (force) {
    const del = await prisma.expense.deleteMany({
      where: { houseId, notes: IMPORT_NOTE },
    });
    console.log(`Rimosse ${del.count} spese precedenti con tag import.`);
  } else {
    const existing = await prisma.expense.count({ where: { houseId, notes: IMPORT_NOTE } });
    if (existing > 0) {
      console.error(
        `Esistono già ${existing} spese importate (note: "${IMPORT_NOTE}"). Rilancia con --force per cancellarle e reimportare.`,
      );
      process.exit(1);
    }
  }

  const pair = [andrea.userId, francesco.userId] as const;

  for (const row of ROWS) {
    const amountCents = euroToCents(row.amountEuro);
    const paidById = row.payer === "andrea" ? andrea.userId : francesco.userId;
    const firstShare = Math.floor(amountCents / 2);
    const secondShare = amountCents - firstShare;

    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          houseId,
          title: row.title,
          amountCents,
          paidById,
          expenseDate: row.expenseDate,
          notes: IMPORT_NOTE,
        },
      });
      await tx.expenseSplit.create({
        data: { expenseId: expense.id, userId: pair[0], shareCents: firstShare },
      });
      await tx.expenseSplit.create({
        data: { expenseId: expense.id, userId: pair[1], shareCents: secondShare },
      });
    });
  }

  console.log(`Importate ${ROWS.length} spese nella casa ${houseId}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
