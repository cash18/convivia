import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "prisma", "migrations");

for (const name of fs.readdirSync(base)) {
  if (name === "migration_lock.toml" || name.startsWith(".")) continue;
  const dir = path.join(base, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const sql = path.join(dir, "migration.sql");
  if (!fs.existsSync(sql)) {
    console.error(
      `[check-migration-dirs] Cartella senza migration.sql: ${name}\n` +
        "Rimuovi la cartella o ripristina il file (Prisma P3015 in migrate deploy).",
    );
    process.exit(1);
  }
}
