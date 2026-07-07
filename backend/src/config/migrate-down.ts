import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pool } from "./db";

// Mirrors the schema/table drizzle-orm's own migrate() creates (see
// drizzle-orm/pg-core/dialect.ts) so this reads/writes the exact same
// tracking table drizzle-kit's "migrate" command uses.
const DRIZZLE_DIR = path.resolve(__dirname, "../../drizzle");
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

interface JournalEntry {
  idx: number;
  tag: string;
  when: number;
}

function readJournal(): JournalEntry[] {
  const journalPath = path.join(DRIZZLE_DIR, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as { entries: JournalEntry[] };
  return journal.entries;
}

function splitStatements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function migrateDown(): Promise<void> {
  const { rows } = await pool.query<{ created_at: string }>(
    `SELECT created_at FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} ORDER BY created_at DESC LIMIT 1`,
  );
  const lastApplied = rows[0];
  if (!lastApplied) {
    console.log("[migrate:down] no applied migrations found, nothing to roll back");
    return;
  }

  const lastAppliedAt = Number(lastApplied.created_at);
  const entry = readJournal().find((candidate) => candidate.when === lastAppliedAt);
  if (!entry) {
    throw new Error(
      `[migrate:down] no journal entry matches the most recently applied migration (created_at=${lastAppliedAt}) — is drizzle/meta/_journal.json out of sync with the database?`,
    );
  }

  const downPath = path.join(DRIZZLE_DIR, `${entry.tag}.down.sql`);
  if (!existsSync(downPath)) {
    throw new Error(
      `[migrate:down] missing ${entry.tag}.down.sql — every migration must ship a matching .down.sql file ` +
        `(see library-docs.md's "Drizzle ORM" section). Refusing to leave the database in a partially-migrated state.`,
    );
  }

  const statements = splitStatements(readFileSync(downPath, "utf-8"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query(`DELETE FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} WHERE created_at = $1`, [lastAppliedAt]);
    await client.query("COMMIT");
    console.log(`[migrate:down] rolled back ${entry.tag}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`[migrate:down] failed to roll back ${entry.tag}`, error);
    throw error;
  } finally {
    client.release();
  }
}

migrateDown()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("[migrate:down] error", error);
    await pool.end();
    process.exit(1);
  });
