import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";

const migrationsDir = path.resolve(__dirname, "../../migrations");

async function ensureMigrationsTable(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await db.query<{ name: string }>("SELECT name FROM schema_migrations");
  return new Set(rows.map((row: { name: string }) => row.name));
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(path.join(migrationsDir, file), "utf-8");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`[migrate] applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`[migrate] failed to apply ${file}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("[migrate] up to date");
}

runMigrations()
  .then(() => db.end())
  .catch(async (error) => {
    console.error("[migrate] error", error);
    await db.end();
    process.exit(1);
  });
