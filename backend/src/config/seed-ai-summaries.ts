import { and, eq, isNull } from "drizzle-orm";
import { db, pool } from "./db";
import { env } from "./env";
import { hotelAiSummaries } from "../models/ai.schema";
import { hotels } from "../models/hotel.schema";
import { getHotelSummary } from "../services/ai.service";

// Warms hotel_ai_summaries so real visitors hit the cache instead of waiting on the
// model. Run with `pnpm seed:ai-summaries`, or `--force` to rewrite rows whose
// content is unchanged (after a prompt or model change). Safe to re-run.
async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  const published = await db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .where(and(eq(hotels.status, "published"), isNull(hotels.deletedAt)));

  console.log(`[seed:ai-summaries] ${published.length} published hotels${force ? " (force)" : ""}`);

  let generated = 0;
  let cached = 0;
  let failed = 0;

  for (const hotel of published) {
    if (force) {
      await db.delete(hotelAiSummaries).where(eq(hotelAiSummaries.hotelId, hotel.id));
    }

    const before = force ? null : await db.query.hotelAiSummaries.findFirst({
      where: eq(hotelAiSummaries.hotelId, hotel.id),
    });

    const summary = await getHotelSummary(hotel.id, env.AI_SEED_TIMEOUT_MS);

    if (!summary) {
      failed += 1;
      console.error(`  ✗ ${hotel.name}`);
      continue;
    }

    const after = await db.query.hotelAiSummaries.findFirst({
      where: eq(hotelAiSummaries.hotelId, hotel.id),
    });

    if (before && after && before.generatedAt === after.generatedAt) {
      cached += 1;
      console.log(`  · ${hotel.name} (already current)`);
    } else {
      generated += 1;
      console.log(`  ✓ ${hotel.name}`);
    }
  }

  console.log(`[seed:ai-summaries] generated ${generated}, unchanged ${cached}, failed ${failed}`);
}

main()
  .catch((error) => {
    console.error("[seed:ai-summaries] failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
